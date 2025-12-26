const Assistant = require("../models/assistant.model.js");

exports.getAssistants = async (req, res) => {
  try {
    const assistants = await Assistant.find()
      .populate("createdBy", "-password")
      .sort([["createdAt", -1]])
      .exec();

    return res.status(200).json({
      success: true,
      assistants: assistants,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching all assistants.",
    });
  }
};

exports.getAssistantsByOwner = async (req, res) => {
  const authenticatedUserId = req.userId;
  try {
    const myAssistants = await Assistant.find({
      createdBy: authenticatedUserId,
    }).populate("createdBy", "-password");
    res.status(200).json({
      success: true,
      assistants: myAssistants,
    });
  } catch (err) {
    console.info("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching owner assistants.",
    });
  }
};

exports.getAssistant = async (req, res) => {
  const assistantId = req.params.id;

  try {
    const assistant = await Assistant.findById(assistantId).populate(
      "createdBy category",
      "-password"
    );
    return res.status(200).json({
      success: true,
      assistant: assistant,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message:
        err.message || "Something went wrong while fetching all assistants.",
    });
  }
};

// exports.getPublications = async (req, res) => {};

exports.createAssistant = async (req, res) => {
  const authenticatedUserId = req.userId;
  const {
    name,
    description,
    price,
    discount,
    pictureMedia,
    mediaFiles,
    companyName,
    companyEmail,
    companyDescription,
    companyLogoMedia,
    companyCoverMedia,
    locationLatitude,
    locationLongitude,
    locationAddress,
    categoryId,
  } = req.body;

  newAssistant = new Assistant({
    name: name,
    description: description,
    price: price,
    discount: discount,
    pictureMedia: pictureMedia,
    mediaFiles: mediaFiles,
    companyName: companyName,
    companyEmail: companyEmail,
    companyDescription: companyDescription,
    companyLogoMedia: companyLogoMedia,
    companyCoverMedia: companyCoverMedia,
    locationLatitude: locationLatitude,
    locationLongitude: locationLongitude,
    locationAddress: locationAddress,
    category: categoryId,
    createdAt: Date.now(),
    createdBy: authenticatedUserId,
  });

  try {
    const createdAssistant = await newAssistant.save();

    res.status(201).json({
      success: true,
      message: "Assistant was created successfully",
      assistant: createdAssistant,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while creating the Assistant.",
    });
  }
};

exports.updateAssistant = async (req, res) => {
  const assistantId = req.params.id;
  const {
    name,
    description,
    price,
    discount,
    pictureMedia,
    mediaFiles,
    companyName,
    companyEmail,
    companyDescription,
    companyLogoMedia,
    companyCoverMedia,
    locationLatitude,
    locationLongitude,
    locationAddress,
    categoryId,
  } = req.body;

  try {
    const assistantToUpdate = await Assistant.findById(assistantId);

    assistantToUpdate.name = name;
    assistantToUpdate.description = description;
    assistantToUpdate.price = price;
    assistantToUpdate.discount = discount;
    assistantToUpdate.pictureMedia = pictureMedia;
    assistantToUpdate.mediaFiles = mediaFiles;
    assistantToUpdate.companyName = companyName;
    assistantToUpdate.companyEmail = companyEmail;
    assistantToUpdate.companyDescription = companyDescription;
    assistantToUpdate.companyLogoMedia = companyLogoMedia;
    assistantToUpdate.companyCoverMedia = companyCoverMedia;
    assistantToUpdate.locationLatitude = locationLatitude;
    assistantToUpdate.locationLongitude = locationLongitude;
    assistantToUpdate.locationAddress = locationAddress;
    assistantToUpdate.category = categoryId;
    assistantToUpdate.updatedAt = Date.now();

    const updatedAssistant = await assistantToUpdate.save();

    return res.status(201).json({
      success: true,
      message: "Assistant was updated successfully",
      assistant: updatedAssistant,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while updating the Assistant.",
    });
  }
};

exports.removeAssistant = async (req, res) => {
  const assistantId = req.params.id;

  try {
    const removedAssistant = await Assistant.findByIdAndRemove(assistantId);
    res.status(201).json({
      success: true,
      message: "Assistant removed successfully",
      removedAssistant: removedAssistant,
    });
  } catch (err) {
    console.error("[err]", err);
    res.status(500).send({
      message:
        err.message || "Something went wrong while removing the Assistant.",
    });
  }
};
