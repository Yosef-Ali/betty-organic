# TELEGRAM BOT SETUP - SUPER EASY FROM ETHIOPIA! 🇪🇹

## Step 1: Create Your Bot (2 minutes)
1. Open Telegram on your phone
2. Search for: @BotFather
3. Send message: /newbot
4. Give your bot a name: "Betty Organic Orders"
5. Give username: "betty_organic_bot" (or any unique name)
6. You'll get a token like: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

## Step 2: Get Your Chat ID (1 minute)
1. Start a chat with your new bot (search for @betty_organic_bot)
2. Send any message like "Hello"
3. Open this URL in your browser:
   https://api.telegram.org/bot[YOUR_TOKEN]/getUpdates
   
   Example:
   https://api.telegram.org/bot1234567890:ABCdefGHIjklMNOpqrsTUVwxyz/getUpdates

4. Look for "chat":{"id":123456789} - that's your chat ID!

## Step 3: Add to .env.local
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_ADMIN_CHAT_ID=123456789
```

## That's it! 🎉

Your orders will now send automatic notifications to your Telegram!
