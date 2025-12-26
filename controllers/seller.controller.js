const Seller = require("../models/seller.model.js");
const User = require("../models/user.model.js");

const fetch = require("node-fetch");

// Sellers
exports.createSellerCredentials = async (req, res) => {
  const userId = req.userId;

  try {
    const marketplaceAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const {
      marketplaceSellerAuthorizationCode,
      marketplaceRandomValidationId,
      marketplaceRedirectURI,
    } = req.body;

    const requestData = {
      client_secret: marketplaceAccessToken,
      grant_type: "authorization_code",
      code: marketplaceSellerAuthorizationCode,
      redirect_uri: marketplaceRedirectURI,
    };
    const mercadopagoApiBaseUrl = process.env.MERCADOPAGO_API_BASE_URL;
    const url = `${mercadopagoApiBaseUrl}/oauth/token`;
    const options = { method: "POST", body: JSON.stringify(requestData) };

    fetch(url, options)
      .then((res) => res.json())
      .then(async (mercadopagoResponse) => {
        const {
          access_token: marketplaceAccessToken,
          token_type: marketplaceTokenType,
          expires_in: marketplaceExpiresAt,
          scope: marketplaceScope,
          user_id: marketplaceUserId,
          refresh_token: marketplaceRefreshToken,
          public_key: marketplacePublicKey,
          live_mode: marketplaceLiveMode,
        } = mercadopagoResponse;

        const seller = new Seller({
          user: userId,
          marketplaceAccessToken: marketplaceAccessToken,
          marketplaceTokenType: marketplaceTokenType,
          marketplaceExpiresAt: marketplaceExpiresAt
            ? new Date(marketplaceExpiresAt)
            : null,
          marketplaceScope: marketplaceScope,
          marketplaceUserId: marketplaceUserId,
          marketplaceRefreshToken: marketplaceRefreshToken,
          marketplacePublicKey: marketplacePublicKey,
          marketplaceLiveMode: marketplaceLiveMode,
          createdAt: Date.now(),
        });

        const savedSeller = await seller.save();
        const sellerUser = await User.findById(userId);

        sellerUser.seller = savedSeller._id;
        await sellerUser.save();

        res.status(200).json({
          success: true,
          message: "Credentials were created successfully",
          seller: savedSeller,
        });
      })
      .catch((err) => {
        console.error("error:" + err);
        res.status(500).json({
          message: "Error reading connections",
        });
      });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message: err.message || "Something went wrong while fetch user data.",
    });
  }
};

exports.updateSellerCredentials = async (req, res) => {
  const userId = req.userId;

  try {
    console.info("[userId] payment/credentials", userId);
    // @todo: Do auth
    return res.status(201).json({
      success: true,
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message: err.message || "Something went wrong while fetch user data.",
    });
  }
};

exports.removeSellerCredentials = async (req, res) => {
  const userId = req.userId;

  try {
    const seller = await Seller.findOne({ user: userId });
    const user = await User.findById(userId);
    user.seller = null;

    await user.save();
    await seller.remove();

    return res.status(200).send({
      success: true,
      message: "Credentials was removed successfully",
    });
  } catch (err) {
    console.error("[err]", err);
    return res.status(500).send({
      message: "Something went wrong while remove seller credentials",
    });
  }
};
