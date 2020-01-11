import Upload from "../models/Upload";

class UploadController {
  async store(req, res) {
    const { originalname: name, filename: path } = req.file;
    const file = await Upload.create({
      name,
      path
    });

    return res.json(file);
  }
}

export default new UploadController();
