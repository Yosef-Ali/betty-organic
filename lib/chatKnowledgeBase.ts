export type ChatResponse = {
  keywords: string[];
  response: string;
  followUp?: string;
};

export const knowledgeBase: ChatResponse[] = [
  {
    keywords: ['delivery', 'shipping', 'deliver', 'time'],
    response: "We offer next-day delivery for all orders placed before 8 PM. Delivery is free for orders over $50! 🚚",
    followUp: "Would you like to know about our delivery areas?"
  },
  {
    keywords: ['fruit', 'fruits', 'available', 'products'],
    response: "Our current seasonal fruits include: 🍎 Apples, 🍌 Bananas, 🫐 Blueberries, 🥝 Kiwis, and more!",
    followUp: "Would you like to see our complete fruit catalog?"
  },
  {
    keywords: ['organic', 'certification', 'certified'],
    response: "All our fruits are 100% certified organic by USDA. We work directly with certified organic farmers. 🌱",
    followUp: "Would you like to learn more about our farming partners?"
  },
  {
    keywords: ['price', 'cost', 'pricing', 'expensive'],
    response: "Our prices are competitive and reflect the premium quality of organic produce. We also offer weekly subscription boxes at discounted rates! 🏷️",
    followUp: "Would you like to see our current prices?"
  },
  {
    keywords: ['box', 'subscription', 'weekly', 'monthly'],
    response: "Our subscription boxes come in three sizes: Small ($25), Medium ($45), and Family ($65). Each includes a seasonal variety of fruits! 📦",
    followUp: "Would you like to start a subscription?"
  },
  {
    keywords: ['fresh', 'quality', 'guarantee'],
    response: "We guarantee 100% freshness! If you're not satisfied with the quality, we'll replace your order or give you a full refund. ✨",
    followUp: "Would you like to place an order?"
  },
  {
    keywords: ['hello', 'hi', 'hey', 'help'],
    response: "Hello! Welcome to Betty Organic! I'm here to help you with our organic fruit delivery service. 👋",
    followUp: "What would you like to know about our services?"
  }
];

export const findBestResponse = (message: string): ChatResponse | null => {
  const lowercaseMessage = message.toLowerCase();
  let bestMatch: ChatResponse | null = null;
  let maxMatches = 0;

  knowledgeBase.forEach(item => {
    const matches = item.keywords.filter(keyword =>
      lowercaseMessage.includes(keyword.toLowerCase())
    ).length;

    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = item;
    }
  });

  return maxMatches > 0 ? bestMatch : null;
};

export const getDefaultResponse = (): ChatResponse => ({
  keywords: [],
  response: "I'm not sure about that, but I'd be happy to help you with information about our organic fruit delivery, prices, or subscription boxes! 🍎",
  followUp: "What would you like to know?"
});
