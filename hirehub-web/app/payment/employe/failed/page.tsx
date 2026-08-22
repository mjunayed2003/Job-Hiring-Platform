"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentFailedPage() {
	const router = useRouter();
	const [visible, setVisible] = useState(false);
// as
	useEffect(() => {
		const timer = setTimeout(() => setVisible(true), 50);
		return () => clearTimeout(timer);
	}, []);

	const handleTryAgain = () => {
		router.replace("/employerr/jobs");
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-[#F4F4F4] to-white flex items-center justify-center px-4 py-6">
			<div className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.12)] ring-1 ring-black/5">
				<div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
					<button
						onClick={() => router.replace("/company/jobs/subcription")}
						className="p-1 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Go back"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<h1 className="text-sm font-semibold text-gray-800 tracking-tight">
						Payment Failed
					</h1>
				</div>

				<div className="px-6 py-10 text-center">
					<div
						className={`mx-auto mb-6 transition-all duration-700 ease-out ${
							visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
						}`}
					>
						<div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#FEF2F2] ring-1 ring-[#FECACA]">
							<Image
								src="/image/powertanz.png"
								alt="Payment Failed"
								width={64}
								height={64}
								className="h-16 w-16 object-contain"
							/>
						</div>
					</div>

					<div
						className={`transition-all duration-700 delay-150 ease-out ${
							visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
						}`}
					>
						<p className="text-[15px] font-bold text-gray-900 text-center">
							Payment failed. Please try again.
						</p>
						<p className="mt-2 text-sm leading-relaxed text-gray-600">
							We could not complete your  payment. You can go back and retry.
						</p>
					</div>

					<div
						className={`mt-8 transition-all duration-700 delay-300 ease-out ${
							visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
						}`}
					>
						<button
							onClick={handleTryAgain}
							className="w-full rounded-full bg-[#dc2626] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#b91c1c] active:scale-[0.99]"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
