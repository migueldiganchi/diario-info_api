const { NlpManager } = require("node-nlp");
const nlpManager = new NlpManager({ languages: ["es"] });
const fs = require("fs");

// OBTAIN DEFAULT ANSWER
const getDefaultAnswer = (answers) => {
  return answers[Math.floor(Math.random() * answers.length)];
};

// OBTAIN DEFAULT ANSWERS FROM FILE
const getDefaultAnswers = async () => {
  const defaultDataFilePath = "./data/training/_default.json";
  const defaultDataFile = await fs.readFileSync(defaultDataFilePath);
  const defaultData = JSON.parse(defaultDataFile);
  const defaultDataAnswers = defaultData.answers ? defaultData.answers : [];

  return defaultDataAnswers;
};

// BOT LEARNING
const learn = async (typing) => {
  const files = await fs.readdirSync("./data/training");

  for (const file of files) {
    const fileData = await fs.readFileSync(`./data/training/${file}`);
    const data = JSON.parse(fileData);
    const intent = file.replace(".json", "");

    if (intent != "_default") {
      // BOT TRAINING -> QUESTIONS
      for (const question of data.questions) {
        nlpManager.addDocument("es", question, intent);
      }
      // BOT TRANING -> ANSWERS
      for (const answer of data.answers) {
        nlpManager.addAnswer("es", intent, answer);
      }
    }
  }

  await nlpManager.train();
  await nlpManager.save();
};

// READ INTERACTION STRUCTURE
const getSequence = async (sequenceKey) => {
  const sequencePath = "./data/sequences";
  const sequenceFiles = await fs.readdirSync(sequencePath);
  const sequenceSet = [];

  let sequenceFileData = null;
  let sequenceData = null;

  for (const sequenceFile of sequenceFiles) {
    sequenceFileData = await fs.readFileSync(`${sequencePath}/${sequenceFile}`);
    sequenceData = JSON.parse(sequenceFileData);
    sequenceSet.push(sequenceData);
  }

  return sequenceSet[sequenceKey];
};

// RESPOND TO THE USER
const respond = async (message) => {
  const botDefaultAnswers = await getDefaultAnswers();
  const botResponse = await nlpManager.process("es", message);
  const botResponseSequence = getSequence(message);
  const botResponseMessage =
    botResponse?.answer && botResponse?.intent != "None"
      ? botResponse.answer
      : await getDefaultAnswer(botDefaultAnswers);

  // Reading Extra Traning Data
  let botResponseData = null;
  try {
    const botDataPath = `./data/training/${botResponse?.intent}.json`;
    const botData = await fs.promises.readFile(botDataPath, "utf-8");
    botResponseData = JSON.parse(botData);
  } catch (err) {
    console.error("[Error reading or parsing traning file]:", err);
  }

  return {
    botResponseIntent: botResponse.intent ? botResponse.intent : null,
    botResponseMessage: botResponseMessage,
    botResponseSequence: botResponseSequence,
    botResponseCategories: botResponseData?.categories || null,
    botResponseSuggestions: botResponseData?.suggestions || null
  };
};

exports.learn = learn;
exports.respond = respond;
