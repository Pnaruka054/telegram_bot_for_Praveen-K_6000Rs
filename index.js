require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const cron = require("node-cron");
const fs = require("fs");
const { createCanvas, loadImage, registerFont } = require('canvas');
const http = require('http');
const path = require("path");

const bot = new TelegramBot(process.env.BOT_TOKEN);
const chatId = process.env.CHAT_ID;

// Posting times: 9am, 11am, 1pm, 3pm, 5pm, 7pm, 9pm
const postingTimes = ["0 9 * * *", "0 11 * * *", "0 13 * * *", "0 15 * * *", "0 17 * * *", "0 19 * * *", "0 21 * * *"];

// Generate all multipliers between 1.40 to 6.00
const signals = [];
for (let i = 1.40; i <= 6.00; i += 0.01) {
    signals.push(i.toFixed(2));
}

// Generate dynamic image
async function generateImageWithText(multiplier, amount) {
    const basePath = path.join(__dirname, 'images', 'dynamic_image.jpg'); // base image without text
    const outputDir = path.join(__dirname, 'output');
    const outputPath = path.join(outputDir, `${multiplier}x.jpg`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // ✅ If image already exists, return the path
    if (fs.existsSync(outputPath)) {
        return outputPath;
    }

    // Load base image
    const image = await loadImage(basePath);

    // Create canvas with base image size
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw base image on canvas
    ctx.drawImage(image, 0, 0);

    // Set font style - change size and font as per need
    ctx.font = 'bold 48px Sans-serif';
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';

    // Draw multiplier text
    ctx.fillText(`${multiplier}x`, 320, 130);

    // Draw amount text
    ctx.fillText(`${amount}`, 730, 130);

    // Save the canvas to a file (JPEG)
    const out = fs.createWriteStream(outputPath);
    const stream = canvas.createJPEGStream({
        quality: 0.95,
        progressive: true,
        chromaSubsampling: true
    });
    stream.pipe(out);

    // Return path after stream finishes
    return new Promise((resolve, reject) => {
        out.on('finish', () => resolve(outputPath));
        out.on('error', reject);
    });
}

// Main session logic
const sendSession = async () => {
    let signalCount = 1;
    let multipliers = [];

    const sendRound = async () => {
        const multiplier = signals[Math.floor(Math.random() * signals.length)];
        const amount = Math.floor(Math.random() * 5000 + 1000); // Random ₹1000–₹6000
        multipliers.push(multiplier);

        await bot.sendMessage(chatId, `🛎 PREPARE FOR THE SIGNAL - ${signalCount} ‼️🚨`);

        setTimeout(async () => {
            await bot.sendMessage(chatId, `✈️ BET ✈️\n${multiplier}x`);
        }, 30 * 1000);

        setTimeout(async () => {
            const imagePath = await generateImageWithText(multiplier, amount);
            const options = {
                caption: "💸✅",
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ Register Now ✅", url: "https://1wtrog.life/?p=tvyn" }]
                    ]
                }
            };

            const photoStream = fs.createReadStream(imagePath);
            await bot.sendPhoto(chatId, photoStream, options);
        }, 60 * 1000);

        signalCount++;
    };

    // 6 rounds spaced by 2 minutes
    for (let i = 0; i < 6; i++) {
        setTimeout(sendRound, i * 2 * 60 * 1000);
    }

    // Summary after 12 minutes
    setTimeout(async () => {
        let summary = "🤑 TOTAL EARNINGS:\n\n₹19810\n\n";
        multipliers.forEach((multi) => {
            const symbol = parseFloat(multi) > 3 ? "🔥" : "✅";
            summary += `${symbol}${multi}x\n`;
        });
        summary += `\nSTAY TUNED FOR THE NEXT SESSION ✈️‼️`;

        await bot.sendMessage(chatId, summary);
    }, 12 * 60 * 1000);
};

// Setup all scheduled sessions
postingTimes.forEach((cronTime) => {
    cron.schedule(cronTime, () => {
        console.log("⏰ Running scheduled session");
        sendSession();
    }, {
        timezone: "Asia/Kolkata" // ✅ Timezone added
    });
});

async function welcome() {
    await bot.sendMessage(chatId, `🤖 Bot is live! Glad to have you here!`);
}

welcome()

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Bot is running');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
