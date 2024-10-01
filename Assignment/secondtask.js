const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

const app = express();

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("video"), (req, res) => {
  const videoPath = path.join(__dirname, req.file.path);

  ffmpeg.ffprobe(videoPath, (err, metadata) => {
    if (err) {
      console.error("Error during ffprobe:", err);
      return res.status(500).json({ message: "Error analyzing video metadata" });
    }

    const videoDuration = metadata.format.duration;

    if (videoDuration > 1000) {
      return res.status(400).json({ message: "Video duration exceeds 1000 seconds limit" });
    }

    const processedVideoPath = `processed_${req.file.filename}.mp4`;

    ffmpeg(videoPath)
      .output(processedVideoPath)
      .on("end", () => {
        res.json({
          message: "Video processed successfully",
          outputFile: processedVideoPath,
        });
      })
      .on("error", (err) => {
        console.error("Error processing video:", err);
        res.status(500).json({ message: "Error processing video", error: err.message });
      })
      .run();
  });
});

app.listen(3001, () => console.log("Video processing server is up on port 3001"));

