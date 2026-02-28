import axios from "axios";
import { HttpError, BAD_REQUEST, INTERNAL_SERVER_ERROR } from "../utils/HttpError.js";

// Parse "HH:mm" into total minutes
const parseTimeToMinutes = (time) => {
  if (!time || typeof time !== "string") {
    throw new HttpError(BAD_REQUEST, "Invalid time format");
  }

  const [hours, minutes] = time.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new HttpError(BAD_REQUEST, "Time must be in HH:mm format");
  }

  return hours * 60 + minutes;
};


// Build ISO datetime for Zoom
const buildZoomStartTime = (dateValue, startTime) => {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new HttpError(BAD_REQUEST, "Invalid appointment date");
  }

  const startMinutes = parseTimeToMinutes(startTime);

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCMinutes(startMinutes);

  return date.toISOString();
};


// Calculate duration in minutes
const calculateDuration = (startTime, endTime) => {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  const diff = end - start;
  return diff > 0 ? diff : 60; 
};


// Get Zoom OAuth Access Token
const getZoomAccessToken = async () => {
  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env;

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new HttpError(
      BAD_REQUEST,
      "Zoom environment variables are missing"
    );
  }

  try {
    const response = await axios.post(
      "https://zoom.us/oauth/token",
      null,
      {
        params: {
          grant_type: "account_credentials",
          account_id: ZOOM_ACCOUNT_ID
        },
        auth: {
          username: ZOOM_CLIENT_ID,
          password: ZOOM_CLIENT_SECRET
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    const message = error.response?.data?.message;
    throw new HttpError(
      INTERNAL_SERVER_ERROR,
      message || "Zoom authentication failed"
    );
  }
};


// Create Zoom Meeting
export const createZoomMeeting = async ({ date, startTime, endTime, topic }) => {
  const token = await getZoomAccessToken();

  const startDateTime = buildZoomStartTime(date, startTime);
  const duration = calculateDuration(startTime, endTime);

  try {
    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: topic || "TherapEase Session",
        type: 2,
        start_time: startDateTime,
        duration,
        timezone: process.env.ZOOM_TIMEZONE || "Europe/Dublin",
        settings: {
          join_before_host: false,
          waiting_room: true,
          participant_video: true,
          host_video: true
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return {
      id: response.data.id,
      joinUrl: response.data.join_url
    };

  } catch (error) {
    const message = error.response?.data?.message;
    throw new HttpError(
      INTERNAL_SERVER_ERROR,
      message || "Failed to create Zoom meeting"
    );
  }
};


// Delete Zoom Meeting
export const deleteZoomMeeting = async (meetingId) => {
  const token = await getZoomAccessToken();

  try {
    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  } catch (error) {
    const message = error.response?.data?.message;
    throw new HttpError(
      INTERNAL_SERVER_ERROR,
      message || "Failed to delete Zoom meeting"
    );
  }
};