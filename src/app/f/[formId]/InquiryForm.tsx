"use client";

import { useState, useTransition } from "react";
import { submitInquiry } from "./_action";

const US_STATES: Array<{ code: string; name: string }> = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

export function InquiryForm({
  formId,
  honeypotField,
}: {
  formId: string;
  honeypotField: string;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");
  const [smsService, setSmsService] = useState(false);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !state) {
      setError("Please complete all required fields.");
      return;
    }
    startTransition(async () => {
      const result = await submitInquiry({
        formId,
        firstName,
        lastName,
        email,
        phone,
        state,
        smsConsentService: smsService,
        smsConsentMarketing: smsMarketing,
        honeypot,
      });
      if (result.ok) {
        setSuccess(result.successMessage);
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-6 text-center">
        <div className="text-[14px] leading-6 text-ink">{success}</div>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-gray-400 focus:border-[#13644e] focus:ring-1 focus:ring-[#13644e]";
  const labelClass =
    "block text-[12px] font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name={honeypotField}
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>First Name *</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Last Name *</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="(555) 555-5555"
        />
      </div>

      <div>
        <label className={labelClass}>State Where Property Was Located *</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select a state</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={smsService}
            onChange={(e) => setSmsService(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#13644e]"
          />
          <span className="text-[12px] leading-5 text-gray-600">
            By checking this box, I consent to receive non-marketing text messages about case updates, appointment coordination, and client communications. Message frequency varies, message and data rates may apply. Text HELP for assistance, reply STOP to opt out.
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={smsMarketing}
            onChange={(e) => setSmsMarketing(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#13644e]"
          />
          <span className="text-[12px] leading-5 text-gray-600">
            By checking this box, I consent to receive marketing and promotional messages including special offers, discounts, and product updates at the phone number provided. Frequency may vary. Message and data rates may apply. Text HELP for assistance, reply STOP to opt out.
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md px-4 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        style={{
          background: "linear-gradient(90deg, #04261c 0%, #13644e 100%)",
        }}
      >
        {pending ? "Submitting..." : "Submit My Request"}
      </button>
    </form>
  );
}
