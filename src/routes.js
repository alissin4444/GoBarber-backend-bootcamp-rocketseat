import { Router } from "express";
import multer from "multer";
import multerConfig from "./config/multer";

import UploadController from "./app/controllers/UploadController";

import UserController from "./app/controllers/UserController";
import SessionController from "./app/controllers/SessionController";
import ProviderController from "./app/controllers/ProviderController";
import AppointmentController from "./app/controllers/ApointmentController";
import ScheduleController from "./app/controllers/ScheduleController";
import NotificationController from "./app/controllers/NotificationController";
import AvailableController from "./app/controllers/AvailableController";

import authMiddleware from "./app/middlewares/auth";
const routes = new Router();
const upload = multer(multerConfig);

routes.post("/sessions", SessionController.store);

routes.post("/users", UserController.store);

routes.use(authMiddleware);

routes.put("/users", UserController.update);
routes.post("/files", upload.single("file"), UploadController.store);

routes.get("/providers", ProviderController.index);
routes.get("/providers/:providerId/available", AvailableController.index);

routes.get("/appointments", AppointmentController.index);
routes.post("/appointments", AppointmentController.store);
routes.delete("/appointments/:id", AppointmentController.destroy);

routes.get("/schedules", ScheduleController.index);

routes.get("/notifications", NotificationController.index);
routes.put("/notifications/:id", NotificationController.update);

export default routes;
