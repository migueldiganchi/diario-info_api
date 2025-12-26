const { GoogleGenerativeAI } = require("@google/generative-ai");
const Publication = require("../models/publication.model.js");
const User = require("../models/user.model.js");
const Category = require("../models/category.model.js");

const genAIKey = process.env.GENIMI_API_KEY;
const genAIModel = "gemini-2.5-flash";
const genAI = new GoogleGenerativeAI(genAIKey);

// Function to get the response from Gemini AI
const getGenAIAnswer = async (userMessage) => {
  const ai = genAI.getGenerativeModel({
    model: genAIModel,
  });

  const aiResult = await ai.generateContent(userMessage);
  const aiResponse = await aiResult.response;
  const aiResponseText = aiResponse.text();

  return aiResponseText;
};

// Function to create the combined prompt for the bot
const createCombinedPrompt = (userMessage, publications, categories, users) => {
  // Base introduction and instructions for the bot
  let prompt = `Tu nombre es BOT El DiarioInfo Bot.
  Eres el Representante Virtual de DiarioInfo, una plataforma dedicada a proveer productos y servicios relacionados con la construcción, domótica e inmobiliaria.
  DiarioInfo utiliza Inteligencia Artificial para recomendar productos y servicios a través de conversaciones con los usuarios. El usuario ha enviado el siguiente mensaje: "${userMessage}". 
  Aquí tienes información sobre publicaciones, categorías y usuarios que podrían estar relacionados con el mensaje del usuario. A continuación, analiza la información y responde al usuario de forma apropiada, además de identificar los IDs de los elementos relacionados.\n\n`;

  // Presenting publications
  prompt += `### Publicaciones:\n`;
  publications.forEach((pub, index) => {
    prompt += `${index + 1}. Título: ${pub.title}\nDescripción: ${pub.description
      }\nID: ${pub._id}\n\n`;
  });

  // Presenting categories
  prompt += `### Categorías:\n`;
  categories.forEach((cat, index) => {
    prompt += `${index + 1}. Nombre: ${cat.name}\nID: ${cat._id}\n\n`;
  });

  // Presenting users
  prompt += `### Usuarios:\n`;
  users.forEach((user, index) => {
    prompt += `${index + 1}. Nombre: ${user.name}\nEmail: ${user.email}\nID: ${user._id
      }\n\n`;
  });

  // Ask for a combined response
  prompt += `Responde al mensaje del usuario en un tono profesional y amigable y luego, indica los IDs de las publicaciones, categorías y usuarios relacionados en el siguiente formato JSON:\n`;
  prompt += `{\n  "message": "Mensaje de respuesta al usuario",\n  "publications": [ID1, ID2, ...],\n  "categories": [ID1, ID2, ...],\n  "users": [ID1, ID2, ...]\n}\n`;

  return prompt;
};

const removeIdsFromText = (text) => {
  return text.replace(/\(ID: [a-fA-F0-9]{24}\)/g, "").trim();
};

exports.io = async (req, res) => {
  const { interaction } = req.body;
  const { message } = interaction;
  const userMessage = message ? message : "";
  const userId = req.userId;

  try {
    const user = await User.findById(userId);

    if (user) {
      console.log("[This User is Talking] => ", user);
    }

    // Fetch related entities from the database without limiting the results
    const relatedPublications = await Publication.find().select(
      "title description _id category createdBy"
    );
    const relatedCategories = await Category.find().select(
      "name description _id"
    );
    const relatedUsers = await User.find().select(
      "name pictureUrl bio description email _id"
    );

    // Create combined prompt for AI
    const combinedPrompt = createCombinedPrompt(
      userMessage,
      relatedPublications,
      relatedCategories,
      relatedUsers
    );

    // Get combined response from Gemini AI && Clean up and extract
    // JSON part from the AI Response
    const genAIAnswer = await getGenAIAnswer(combinedPrompt);
    const jsonStartIndex = genAIAnswer.indexOf("{");
    const jsonEndIndex = genAIAnswer.lastIndexOf("}");

    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      throw new Error("No valid JSON found in the AI response");
    }

    // Extract and parse the JSON data safely
    const jsonResponse = genAIAnswer.slice(jsonStartIndex, jsonEndIndex + 1);

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(jsonResponse);
    } catch (parseError) {
      console.error("[parseError]", parseError);
      return res.status(400).json({
        message: "Error parsing AI response. Please try again.",
      });
    }

    const {
      message: aiMessage,
      publications: pubIds = [],
      categories: catIds = [],
      users: userIds = [],
    } = parsedResponse;

    // Filter the related entities based on the IDs provided by the AI
    const filteredPublications = relatedPublications.filter((pub) =>
      pubIds.includes(pub._id.toString())
    );

    // Include users who created the publications
    const publicationUserIds = new Set(
      filteredPublications
        .map((pub) => pub.createdBy?.toString())
        .filter(Boolean)
    );

    // Include categories of the filtered publications
    const publicationCategoryIds = new Set(
      filteredPublications
        .map((pub) => pub.category?.toString())
        .filter(Boolean)
    );

    // Combine AI-specified user IDs with those from publications
    const allUserIds = new Set([...userIds, ...publicationUserIds]);
    const allCategoryIds = new Set([...catIds, ...publicationCategoryIds]);

    // Filter users and categories based on the combined IDs
    const filteredUsers = relatedUsers.filter((user) =>
      allUserIds.has(user._id.toString())
    );
    const filteredCategories = relatedCategories.filter((cat) =>
      allCategoryIds.has(cat._id.toString())
    );

    return res.status(200).json({
      status: true,
      message: removeIdsFromText(aiMessage),
      publications: filteredPublications,
      users: filteredUsers,
      categories: filteredCategories,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message: "Something went wrong while processing your request.",
    });
  }
};
