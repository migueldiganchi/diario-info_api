const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAIKey = process.env.GENIMI_API_KEY;
const genAIModel = "gemini-2.0-flash";
const genAI = new GoogleGenerativeAI(genAIKey);

const getGenAIAnswer = async (userMessage) => {
  const ai = genAI.getGenerativeModel({ model: genAIModel });
  const aiResult = await ai.generateContent(userMessage);
  const aiResponse = await aiResult.response;
  const aiResponseText = aiResponse.text();

  return aiResponseText;
};

const getRandomAiAnswer = () => {
  const phrases = [
    "Es necesario establecer la API Key del Servicio de Gemini para que funcione la Inteligencia Artificial.",
    "Por favor, configure la API Key del Servicio de Gemini para habilitar las capacidades de Inteligencia Artificial.",
    "El sistema requiere que se configure la API Key del Servicio de Gemini para operar correctamente.",
    "Disculpas, pero la Inteligencia Artificial no funcionará sin una API Key válida del Servicio de Gemini.",
    "Por favor, proporcione la API Key del Servicio de Gemini para continuar utilizando la Inteligencia Artificial.",
    "La API Key del Servicio de Gemini debe configurarse para que la funcionalidad de Inteligencia Artificial esté disponible.",
    "Es imprescindible establecer una API Key válida del Servicio de Gemini para activar la Inteligencia Artificial.",
    "Configure la API Key del Servicio de Gemini para resolver este inconveniente técnico.",
  ];

  // Get Random Phrase
  const randomIndex = Math.floor(Math.random() * phrases.length);
  return phrases[randomIndex];
};

const getBotPrompt = (userMessage) => {
  const prompt = `[[[
    Tu nombre es Aluwind Bot. Y eres el Representante Virtual de Aluwind.IA, 
    una plataforma destinada a resolver la logística de empaquetado 
    de perfiles metalúrgicos.
    [A continuación, considera la siguiente Base de Conocimiento:
    ${JSON.stringify(knowledgeData)}
    Para responder de manera simple y detallada al siguiente mensaje]
  ]]]: ${userMessage}"`;

  return prompt;
};

const getDataBotPrompt = (userMessage) => {
  const prompt = `[[[
    [
      Considera ésta Base de Conocimiento: 
      ${JSON.stringify(knowledgeData)}:
      Y la siguiente estructura de Base de Datos Mysql:
      ${JSON.stringify(knowledgeDataBase)}
      Para convertir el siguiente mensaje, en un Query MySql que 
      permita ejecutarlo y obtener resultados concretos en dicha base de datos
    ]

    [
      POR FAVOR RESPONDE COMO SENIOR NINJA EN MYSQL SERVER CON MÁS 
      DE 30 AÑOS DE EXPERIENCIA PROFESIONAL
      Y PARA CONSTRUIR LOS QUERIES RESPETA AL MÁXIMO 
      NIVEL DE DETALLE LOS NOMBRES DE LAS TABLAS Y DE LOS CAMPOS

      (
        Cuando te digo 'Pedidos', seguro hablo de la tabla orders.
        Cuando te digo 'Items', seguro hablo de la tabla order_items
      )

      IMPORTANTÍSIMO: SI EL QUERY NO INCLUYE 
      TABLAS O CAMPOS QUE SE ENCUENTREN EN LA 
      ESTRUCTURA DE Base de Datos Mysql 
      PROPORCIONADA, NO CONSTRUYAS EL QUERY
    ]
  ]]]: "${userMessage}"`;

  return prompt;
};

const extractQuery = (inputMessages) => {
  // Combine all input messages into a single string if they are multiple
  const combinedMessages = Array.isArray(inputMessages)
    ? inputMessages.join("\n")
    : inputMessages;

  // Regular expression to match SQL queries inside triple backticks
  const sqlRegex = /```(?:mysql|sql)?\s*([\s\S]*?)```/g;

  // Array to store extracted queries
  const queries = [];
  let match;

  // Loop through all matches and extract the query
  while ((match = sqlRegex.exec(combinedMessages)) !== null) {
    queries.push(match[1].trim());
  }

  return queries.length ? queries[0] : "";
};

const extractActions = (userMessage) => {
  const actions = [];

  if (
    userMessage.toLowerCase().includes("rendimiento") ||
    userMessage.toLowerCase().includes("reportes") ||
    userMessage.toLowerCase().includes("panel de control")
  ) {
    actions.push("/admin/dashboard");
  }

  if (
    userMessage.toLowerCase().includes("cliente") ||
    userMessage.toLowerCase().includes("administrar clientes")
  ) {
    actions.push("/admin/clients");
  }

  if (
    userMessage.toLowerCase().includes("usuario") ||
    userMessage.toLowerCase().includes("operador")
  ) {
    actions.push("/admin/users");
  }

  if (
    userMessage.toLowerCase().includes("producto") ||
    userMessage.toLowerCase().includes("perfil")
  ) {
    actions.push("/admin/products");
  }

  if (userMessage.toLowerCase().includes("notificaciones")) {
    actions.push("/admin/notifications");
  }

  if (
    userMessage.toLowerCase().includes("importar") ||
    userMessage.toLowerCase().includes("importador")
  ) {
    actions.push("/admin/importer");
  }

  if (
    userMessage.toLowerCase().includes("balanza") ||
    userMessage.toLowerCase().includes("pesaje")
  ) {
    actions.push("/admin/bascules");
  }

  if (
    userMessage.toLowerCase().includes("configuración") ||
    userMessage.toLowerCase().includes("configurar") ||
    userMessage.toLowerCase().includes("settings")
  ) {
    actions.push("/admin/global-settings");
  }

  if (
    userMessage.toLowerCase().includes("registro") ||
    userMessage.toLowerCase().includes("logs") ||
    userMessage.toLowerCase().includes("auditor")
  ) {
    actions.push("/admin/logs");
  }

  if (
    userMessage.toLowerCase().includes("pedido") ||
    userMessage.toLowerCase().includes("despacho") ||
    userMessage.toLowerCase().includes("preparación") ||
    userMessage.toLowerCase().includes("preparaciones")
  ) {
    actions.push("/admin/orders");
  }

  if (
    userMessage.toLowerCase().includes("inventario") ||
    userMessage.toLowerCase().includes("stock")
  ) {
    actions.push("/admin/stock");
  }

  return actions;
};

exports.io = async (req, res) => {
  const { interaction } = req.body;
  const { message } = interaction;
  const userMessage = message ? message : "";

  try {
    const genQuestion = getBotPrompt(userMessage);
    // const genDataBaseQuestion = getDataBotPrompt(userMessage);
    // const genDataBaseAnswer = await getGenAIAnswer(genDataBaseQuestion);
    // const genAIQuery = extractQuery(genDataBaseAnswer);

    let aiAnswer;
    let aiData = null;
    let aiActions = [];

    // if (genAIQuery) {
    try {
      aiAnswer = await getGenAIAnswer(genQuestion);
      aiActions = extractActions(userMessage);

      // DATA READER
      // aiData = await readDynamicQuery(genAIQuery);
      // aiAnswer = await getGenAIAnswer(
      //   `Por favor infiere una respuesta profesional, detallada y
      //     en español de éstos datos: ${JSON.stringify(aiData)}`
      // );
    } catch (aiQueryError) {
      console.info(`[aiQueryError]`, aiQueryError);
      aiAnswer = getRandomAiAnswer();
    }
    // } else {
    //   console.info("[NO QUERY HERE]");
    //   aiAnswer = await getGenAIAnswer(genQuestion);
    // }

    return res.status(200).json({
      status: true,
      message: aiAnswer,
      actions: aiActions,
      data: aiData,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message: "Something was wrong while training model",
    });
  }
};

exports.getQASourceData = (req, res) => {
  try {
    const { source } = req.params;
    const sourceData = knowledgeData[source];

    return res.status(200).json({
      status: true,
      qaData: sourceData,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).json({
      message: "Something was wrong while reading source information",
    });
  }
};
