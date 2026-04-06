export interface ParsedExpense {
  description: string;
  amount: number | null;
  mentions: string[];
}

export function parseOmnibar(input: string): ParsedExpense {
  const amountRegex = /(\d+(\.\d{1,2})?)/;
  const mentionRegex = /@(\w+)/g;

  const amountMatch = input.match(amountRegex);
  const amount = amountMatch ? parseFloat(amountMatch[0]) : null;

  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(input)) !== null) {
    mentions.push(match[1]);
  }

  // Remove amount and mentions from description
  let description = input
    .replace(amountRegex, '')
    .replace(mentionRegex, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    description: description || 'New Expense',
    amount,
    mentions,
  };
}
