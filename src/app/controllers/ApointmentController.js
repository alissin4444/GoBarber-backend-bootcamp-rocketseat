import * as Yup from "Yup";
import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import { pt } from "date-fns/locale";

import Appointment from "../models/Appointment";
import User from "../models/User";
import Upload from "../models/Upload";
import Notification from "../schemas/Notification";

import Queue from "../../lib/Queue";
import CancellationMail from "../jobs/CancellationMail";

class ApoitmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ["date"],
      attributes: ["id", "date", "past", "cancelable"],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: "provider",
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
    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      provider_id: Yup.number().required()
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Invalid Fields" });
    }

    const { provider_id, date } = req.body;

    // Check if provider_id is a provider
    const checkProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true
      }
    });

    if (!checkProvider) {
      return res
        .status(400)
        .json({ error: "You can only create a apppointment with a provider" });
    }

    if (provider_id === req.userId) {
      return res.status(400).json({
        error:
          "You can't create appointment when you id is the same as provider_id"
      });
    }

    const hourStart = startOfHour(parseISO(date));

    // Check past date
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: "Past dates are not permited" });
    }

    // Check date availability
    const checkAvailability = await Appointment.findOne({
      where: {
        date: hourStart,
        provider_id,
        canceled_at: null
      }
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: "Appointment date is not available" });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart
    });

    const user = await User.findByPk(req.userId);
    const formatedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' HH:mm'h'",
      {
        locale: pt
      }
    );

    // Notify appointment provider
    await Notification.create({
      content: `Novo agendamento de ${user.name} para o ${formatedDate}`,
      user: provider_id
    });

    return res.json(appointment);
  }

  async destroy(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["name", "email"]
        },
        {
          model: User,
          as: "user",
          attributes: ["name"]
        }
      ]
    });

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment"
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: "You can only cancel appointment 2 hours in advance" });
    }

    appointment.canceled_at = new Date();
    await appointment.save();

    await Queue.add(CancellationMail.key, {
      appointment
    });

    return res.json(appointment);
  }
}

export default new ApoitmentController();
