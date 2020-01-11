import User from "../models/User";
import Upload from "../models/Upload";

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: {
        provider: true
      },
      attributes: ["id", "name", "email", "avatar_id"],
      include: [
        {
          model: Upload,
          as: "avatar",
          attributes: ["name", "path", "url"]
        }
      ]
    });

    return res.json(providers);
  }
}

export default new ProviderController();
