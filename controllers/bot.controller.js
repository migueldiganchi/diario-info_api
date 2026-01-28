const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/user.model.js");
const Article = require("../models/article.model.js");
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
const createCombinedPrompt = (userMessage, articles, categories, users) => {
  // Base introduction and instructions for the bot
  let prompt = `Tu nombre es BOT El Constructor.
  Eres el Representante Virtual de DIARIO-INFO, una plataforma dedicada a proveer productos y servicios relacionados con la construcción, domótica e inmobiliaria.
  DIARIO-INFO utiliza Inteligencia Artificial para recomendar productos y servicios a través de conversaciones con los usuarios. El usuario ha enviado el siguiente mensaje: "${userMessage}". 
  Aquí tienes información sobre artículos, categorías y usuarios que podrían estar relacionados con el mensaje del usuario. A continuación, analiza la información y responde al usuario de forma apropiada, además de identificar los IDs de los elementos relacionados.\n\n`;

  // Presenting articles
  prompt += `### Artículos:\n`;
  articles.forEach((art, index) => {
    prompt += `${index + 1}. Título: ${art.title}\nDescripción: ${art.description
      }\nID: ${art._id}\n\n`;
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
  prompt += `Responde al mensaje del usuario en un tono profesional y amigable y luego, indica los IDs de los artículos, categorías y usuarios relacionados en el siguiente formato JSON:\n`;
  prompt += `{\n  "message": "Mensaje de respuesta al usuario",\n  "articles": [ID1, ID2, ...],\n  "categories": [ID1, ID2, ...],\n  "users": [ID1, ID2, ...]\n}\n`;

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
    const relatedArticles = await Article.find().select(
      "title description _id category author"
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
      relatedArticles,
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
      articles: artIds = [],
      categories: catIds = [],
      users: userIds = [],
    } = parsedResponse;

    // Filter the related entities based on the IDs provided by the AI
    const filteredArticles = relatedArticles.filter((art) =>
      artIds.includes(art._id.toString())
    );

    // Include users who created the articles
    const articleUserIds = new Set(
      filteredArticles
        .map((art) => art.author?.toString())
        .filter(Boolean)
    );

    // Include categories of the filtered articles
    const articleCategoryIds = new Set(
      filteredArticles
        .map((art) => art.category?.toString())
        .filter(Boolean)
    );

    // Combine AI-specified user IDs with those from articles
    const allUserIds = new Set([...userIds, ...articleUserIds]);
    const allCategoryIds = new Set([...catIds, ...articleCategoryIds]);

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
      articles: filteredArticles,
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
