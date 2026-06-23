export type PhoneNumber = {
  id: string;
  number: string;
  state: string;
  city: string;
  voice: boolean;
  sms: boolean;
  monthly: string;
  status: "active" | "pending";
  purchasedOn: string;
};

export const NUMBERS: PhoneNumber[] = [
  { id: "1", number: "(512) 555 0188", state: "Texas", city: "Austin", voice: true, sms: false, monthly: "$1.50", status: "active", purchasedOn: "Jun 03, 2026" },
  { id: "2", number: "(713) 555 0244", state: "Texas", city: "Houston", voice: true, sms: false, monthly: "$1.50", status: "active", purchasedOn: "Jun 12, 2026" },
  { id: "3", number: "(704) 555 0212", state: "North Carolina", city: "Charlotte", voice: true, sms: false, monthly: "$1.50", status: "active", purchasedOn: "May 18, 2026" },
  { id: "4", number: "(602) 555 0177", state: "Arizona", city: "Phoenix", voice: true, sms: false, monthly: "$1.50", status: "pending", purchasedOn: "Jun 22, 2026" },
];

export const SEARCH_RESULTS = [
  { number: "(404) 555 0291", state: "Georgia", city: "Atlanta", voice: true, sms: false, monthly: "$1.50" },
  { number: "(404) 555 0382", state: "Georgia", city: "Atlanta", voice: true, sms: false, monthly: "$1.50" },
  { number: "(770) 555 0413", state: "Georgia", city: "Marietta", voice: true, sms: false, monthly: "$1.50" },
  { number: "(678) 555 0509", state: "Georgia", city: "Roswell", voice: true, sms: false, monthly: "$1.50" },
];
