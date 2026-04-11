import cron from "node-cron";
import Appointment from "../models/Appointment.js";
import { reminderQueue } from "../queues/reminderQueue.js";

cron.schedule("* * * * *", async () => {
    try {
        console.log("Running reminder scheduler...");

        const tomorrowStart = new Date();
        tomorrowStart.setDate(tomorrowStart.getDate() + 1);
        tomorrowStart.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrowStart);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const appointments = await Appointment.find({
            date: {
                $gte: tomorrowStart,
                $lte: tomorrowEnd
            },
            status: "upcoming",
            reminderSent: false
        }).populate("client");

        for (const appt of appointments) {

            const job = await reminderQueue.add("send-reminder", {
                appointmentId: appt._id,
                phone: appt.client.phone,
                clientName: appt.client.firstName,
                appointmentTime: appt.startTime
            });

            await Appointment.findByIdAndUpdate(appt._id, {
                reminderJobId: job.id
            });
        }

        console.log(`${appointments.length} reminder jobs queued`);
    } catch (error) {
        console.error("Error running reminder scheduler:", error);
    }
});