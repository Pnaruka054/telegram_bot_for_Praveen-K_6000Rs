require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const schedule = require("node-schedule");
const fs = require("fs");
const photo = fs.createReadStream("./images/3rd_message_image.jpg");
const bot = new TelegramBot(process.env.BOT_TOKEN);
const chatId = process.env.CHAT_ID;

// Posting times (24hr cron): 9am, 11am, 1pm, 3pm, 5pm, 7pm, 9pm
const postingTimes = ["0 9 * * *", "0 11 * * *", "0 13 * * *", "0 15 * * *", "0 17 * * *", "0 19 * * *", "0 21 * * *"];

const sendSession = async () => {
    let signalCount = 1;
    let multipliers = [];

    const sendRound = async () => {
        const multiplier = (Math.random() * (6.0 - 1.4) + 1.4).toFixed(2);
        multipliers.push(multiplier);

        // 1. Signal message
        await bot.sendMessage(chatId, `🛎 PREPARE FOR THE SIGNAL - ${signalCount} ‼️🚨`);

        // 2. Bet message
        setTimeout((async () => {
            await bot.sendMessage(chatId, `✈️ BET ✈️\n${multiplier}x`);
        }), 30 * 1000)

        // 3. Wait 1 min then send 💸✅ with buttons and image
        setTimeout(async () => {
            // 1. Send photo
            const options = {
                caption: "💸✅", // This is the message text
                reply_markup: {
                    inline_keyboard: [
                        [{text: "✅ Register Now ✅", url: "https://1wtrog.life/?p=tvyn"}],
                    ]
                }
            };

            await bot.sendPhoto(chatId, photo, options);
        }, 60 * 1000);

        signalCount++;
    };

    // 6 Rounds in 2 minute interval
    for (let i = 0; i < 6; i++) {
        setTimeout(sendRound, i * 2 * 60 * 1000); // every 2 minutes
    }

    // Summary post after 6 rounds (after 12 minutes)
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

Set up cron jobs for each fixed time
postingTimes.forEach((cronTime) => {
    schedule.scheduleJob(cronTime, () => {
        sendSession();
    });
});