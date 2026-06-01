import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

const ICT_MAIL = "mailto:ict.helpdesk@police.gov.gh?subject=GPS%20PMS%20-%20Password%20reset%20request";

export default function ForgotPasswordPage() {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-gradient-to-b from-navy-50 to-white px-6 py-8">
      <div className="w-full max-w-md rounded-2xl border border-navy-100 bg-white p-8 shadow-lg">
        <h1 className="form-heading">Password reset</h1>
        <p className="mt-3 text-sm leading-relaxed text-navy-600">
          Password self-service is not enabled for this system. Contact your unit IT administrator or Ghana Police Service
          ICT helpdesk to request a secure reset.
        </p>
        <a
          href={ICT_MAIL}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1a2a6c] underline-offset-2 hover:text-gold-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6a817]"
        >
          <Mail className="h-4 w-4 shrink-0 text-gold-700" aria-hidden />
          Email ICT helpdesk
        </a>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-800 hover:text-gold-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1a2a6c]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
