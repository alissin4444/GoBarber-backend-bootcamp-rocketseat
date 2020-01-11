import { Op } from "sequelize";
import Appointment from "../models/Appointment";
import User from "../models/User";
import Upload from "../models/Upload";

import { startOfDay, endOfDay, parseISO } from "date-fns";

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: {
        id: req.userId,
        provider: true
      }
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: "User is not a provider" });
    }

    let { date } = req.query;
    const parsedDate = parseISO(date);

    const schedule = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
        }
      },
      attributes: ["id", "date"],
      order: ["date"],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name"],
          include: [
            {
              model: Upload,
              as: "avatar",
              attributes: ["id", "path", "url"]
            }
          ]
        }
      ]
    });

    return res.json(schedule);
  }
}

export default new ScheduleController();
