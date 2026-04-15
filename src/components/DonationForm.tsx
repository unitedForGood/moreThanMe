"use client"
import { useState, useRef, useEffect } from "react";
import Button from "./Button";
import Image from "next/image";

interface DonationFormData {
  name: string;
  amount: number;
  transactionId: string;
  phone?: string;
  message?: string;
}

interface ReceiptData {
  sender_name: string | null;
  sender_phone: string | null;
  from_account: string | null;
  from_upi_id: string | null;
  recipient_name: string | null;
  to_upi_id: string | null;
  amount: number | null;
  status: string | null;
  date_time: string | null;
  transaction_id: string | null;
  payment_method: string | null;
  confidence: number | null;
  notes: string | null;
}

export default function DonationForm() {
  const [formData, setFormData] = useState<DonationFormData>({
    name: "",
    amount: 0,
    transactionId: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Receipt processing states
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [receiptError, setReceiptError] = useState("");
  const [showReceiptSection] = useState(true); // Keep expanded by default
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    amount: number;
    transactionId: string;
    phone?: string;
    message?: string;
    receiptData?: ReceiptData | null;
    status: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NGO UPI ID for display and verification
  const upiId = "8088133722@kotakbank";
  const expectedUpiLast4 = "3722"; // last 4 digits (receipts often show masked: ****3722@kotak)
  const payeeDisplayName = "MoreThanMe";
  const [returningFromUpi, setReturningFromUpi] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flag = window.sessionStorage.getItem("mtm_upi_started");
    if (flag === "1") {
      setReturningFromUpi(true);
    }
  }, []);

  const handleUpiIntent = () => {
    const params = new URLSearchParams();
    params.set("pa", upiId);
    params.set("cu", "INR");
    // We intentionally do NOT pass pn here to maximize compatibility (BHIM, etc.).

    const upiUrl = `upi://pay?${params.toString()}`;

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("mtm_upi_started", "1");
      window.location.href = upiUrl;
    }
  };

  const isUpiMatching = (toUpiId: string | null | undefined): boolean => {
    if (!toUpiId) return false;
    const upiPart = toUpiId.split("@")[0] || "";
    const last4 = upiPart.slice(-4);
    return last4 === expectedUpiLast4;
  };

  const checkDuplicateAndVerify = async (
    transactionId: string,
    recipientName?: string | null,
    toUpiId?: string | null
  ) => {
    try {
      const res = await fetch("/api/donations/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: transactionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.exists) {
        throw new Error(`Transaction ID ${transactionId} already exists in our database.`);
      }
      // Verify only when we have receipt-extracted data
      if (!recipientName || !toUpiId) return false;
      // Banking name must match (case-insensitive): "AKASH G" or "AKASH"
      const nameUpper = recipientName.toUpperCase().trim();
      const nameMatch = nameUpper.includes("AKASH G") || nameUpper.includes("AKASH");
      const upiMatch = isUpiMatching(toUpiId);
      return nameMatch && upiMatch;
    } catch (err) {
      console.error("❌ Error in duplicate/verification check:", err);
      throw err;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setReceiptError("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setReceiptError("File size must be less than 5MB");
        return;
      }

      setReceiptFile(file);
      setReceiptError("");

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async () => {
    if (!receiptFile) {
      setReceiptError("Please select a receipt image first");
      return;
    }

    setIsProcessingReceipt(true);
    setReceiptError("");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', receiptFile);

      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: uploadFormData,
      });

      let result: { error?: string; details?: string; success?: boolean; data?: ReceiptData; quotaExceeded?: boolean; serviceUnavailable?: boolean } = {};
      try {
        const text = await response.text();
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { error: 'Invalid response from server' };
      }

      if (!response.ok) {
        const errMsg = result.error || result.details || 'Failed to process receipt';
        if (result.quotaExceeded || result.serviceUnavailable) {
          throw new Error("Receipt processing is temporarily unavailable. Please try again in a few minutes.");
        }
        if (Object.keys(result).length > 0) {
          console.error("Receipt API error:", result);
        }
        throw new Error(errMsg);
      }

      if (result.success && result.data) {
        const receiptDataRes = result.data as ReceiptData;
        setReceiptData(receiptDataRes);

        // Auto-fill form with extracted data if confidence is high enough
        if (receiptDataRes.confidence && receiptDataRes.confidence > 0.7) {
          // Helper function to parse amount for auto-fill
          const parseAmountForForm = (amount: string | number | null | undefined): number => {

            if (typeof amount === 'number') {
              return amount;
            }
            if (!amount) {
              return 0;
            }

            const amountStr = amount.toString();

            // Remove currency symbols and commas, then parse
            const cleanAmount = amountStr.replace(/[₹$€£¥,]/g, '').trim();

            const parsed = parseFloat(cleanAmount);

            return isNaN(parsed) ? 0 : parsed;
          };

          const parsedAmount = parseAmountForForm(receiptDataRes.amount);

          setFormData(prev => {
            const newFormData = {
              ...prev,
              amount: parsedAmount || prev.amount,
              transactionId: receiptDataRes.transaction_id || prev.transactionId,
              name: receiptDataRes.sender_name || prev.name,
              phone: receiptDataRes.sender_phone || prev.phone
            };
            return newFormData;
          });

          // Auto-submit after data extraction
          setTimeout(() => {
            // Pass the receipt data directly to avoid state timing issues
            handleSubmitWithData({ preventDefault: () => { } } as React.FormEvent<HTMLFormElement>, receiptDataRes);
          }, 1000); // Auto-submit after 1 second
        }

      } else {
        throw new Error("Failed to extract data from receipt");
      }
    } catch (err) {
      console.error("Error processing receipt:", err);
      setReceiptError(err instanceof Error ? err.message : "Failed to process receipt");
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const handleSubmitWithData = async (e: React.FormEvent<HTMLFormElement>, receiptDataOverride?: ReceiptData | null) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Use override data if provided, otherwise use state
      const finalReceiptData = receiptDataOverride || receiptData;

      // Get transaction ID and receipt data for verification
      const transactionId = finalReceiptData?.transaction_id || formData.transactionId;
      const recipientName = finalReceiptData?.recipient_name || null;
      const toUpiId = finalReceiptData?.to_upi_id || null;

      // Check for duplicate and verify: banking name (AKASH G) + last 4 digits of to UPI (3722)
      const isVerified = await checkDuplicateAndVerify(transactionId, recipientName, toUpiId);

      // Prepare donation data with all UPI fields
      // Helper function to parse amount from various formats
      const parseAmount = (amount: string | number | null | undefined): number => {

        if (typeof amount === 'number') {
          return amount;
        }
        if (!amount) {
          return 0;
        }

        const amountStr = amount.toString();

        // Remove currency symbols and commas, then parse
        const cleanAmount = amountStr.replace(/[₹$€£¥,]/g, '').trim();

        const parsed = parseFloat(cleanAmount);

        return isNaN(parsed) ? 0 : parsed;
      };

      // Debug: Log what values we're working with
      // Use AI-extracted data when available, fallback to form data
      const donationData = {
        name: finalReceiptData?.sender_name || formData.name,
        amount: parseAmount(finalReceiptData?.amount || formData.amount),
        transaction_id: transactionId,
        phone: finalReceiptData?.sender_phone || formData.phone,
        message: formData.message,
        status: isVerified ? "verified" : "pending_verification",
        created_at: new Date().toISOString(),
        receipt_processing_status: finalReceiptData ? "completed" : "not_processed",
        receipt_parsed_data: finalReceiptData,
        receipt_confidence: finalReceiptData?.confidence ? parseFloat(finalReceiptData.confidence.toString()) : null,
        receipt_processing_notes: finalReceiptData?.notes || null,
        // UPI specific fields
        sender_name: finalReceiptData?.sender_name || null,
        sender_phone: finalReceiptData?.sender_phone || null,
        from_account: finalReceiptData?.from_account || null,
        from_upi_id: finalReceiptData?.from_upi_id || null,
        recipient_name: finalReceiptData?.recipient_name || null,
        to_upi_id: finalReceiptData?.to_upi_id || null,
        payment_status: finalReceiptData?.status || null,
        payment_date_time: finalReceiptData?.date_time || null,
        payment_method: finalReceiptData?.payment_method || null,
        // Metadata
        ai_model_used: "gemini-2.0-flash",
        processing_time_ms: null // Will be set if we track processing time
      };

      // Validate required fields
      if (!donationData.amount || donationData.amount <= 0) {
        console.error("❌ Amount validation failed:", donationData.amount);
        throw new Error("Valid donation amount is required");
      }

      const insertRes = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: donationData.name,
          amount: donationData.amount,
          transaction_id: donationData.transaction_id,
          phone: donationData.phone,
          message: donationData.message,
          status: donationData.status,
          receipt_processing_status: donationData.receipt_processing_status,
          receipt_confidence: donationData.receipt_confidence,
          receipt_parsed_data: donationData.receipt_parsed_data,
          receipt_date_time: donationData.payment_date_time || null,
        }),
      });
      if (!insertRes.ok) {
        const errData = await insertRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to submit donation");
      }

      // Store the submitted data for the success message before resetting
      const submittedData = {
        name: donationData.name,
        amount: donationData.amount,
        transactionId: donationData.transaction_id,
        phone: donationData.phone,
        message: donationData.message,
        receiptData: finalReceiptData,
        status: donationData.status
      };

      setSubmittedData(submittedData);
      setSubmissionSuccess(true);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("mtm_upi_started");
      }
      setReturningFromUpi(false);
      setReceiptData(null);
      setReceiptFile(null);
      setReceiptPreview(null);
      setFormData({
        name: "",
        amount: 0,
        transactionId: "",
        phone: "",
        message: ""
      });

      // Send email notification
      try {
        await fetch('/api/send-donation-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            donation: {
              name: donationData.name,
              amount: donationData.amount,
              transaction_id: donationData.transaction_id,
              created_at: donationData.created_at,
              receipt_processed: !!receiptData
            }
          }),
        });
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

    } catch (err) {
      console.error("❌ SUBMIT - Error submitting donation:", err);

      // Handle specific error types
      if (err instanceof Error) {
        if (err.message.includes("already exists")) {
          setError("This transaction has already been submitted. Please check your records.");
        } else if (err.message.includes("duplicate key")) {
          setError("This transaction ID already exists in our database.");
        } else {
          setError(`Failed to submit donation: ${err.message}`);
        }
      } else {
        setError("Failed to submit donation. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="relative">
      {/* Creative Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-50 rounded-full filter blur-3xl opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-100 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Header Section */}
      <div className="text-center mb-12">

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-primary-800 leading-tight">
          Choose Your Way to Give
        </h2>

        <p className="text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
          Every contribution matters. Scan the QR code below to make a secure donation.
        </p>
      </div>

      <div className="flex justify-center max-w-md mx-auto">
        {/* QR Code Section */}
        <div id="qr-section" className="w-full relative bg-white rounded-3xl shadow-sm border border-primary-100 p-8 sm:p-10 hover:shadow-lg transition-all duration-300 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent"></div>

          <div className="relative z-10">
            <div className="bg-primary-50 rounded-xl p-3 text-center border border-primary-100/50 mb-6">
              <p className="text-sm font-medium text-primary-800">
                Verified account holder will appear as
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-primary-900 mt-1">
                AKASH G (Kotak Bank)
              </h3>
            </div>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-5 rounded-2xl shadow-inner border border-primary-100">
                <div className="flex flex-col items-center gap-3">
                  <Image
                    src="/morethanmelogo.png"
                    alt="MoreThanMe Logo"
                    width={96}
                    height={24}
                    className="h-7 w-auto"
                  />
                  <p className="text-xs font-semibold text-primary-700 tracking-wide uppercase">
                    More than Me
                  </p>


                  <Image
                    src="/akashqrcode.png"
                    alt="Donate via UPI QR"
                    width={220}
                    height={220}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-5 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Secure
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission Status */}
      {isSubmitting && (
        <div className="mt-8 max-w-md mx-auto bg-white rounded-3xl shadow-sm border border-primary-100 p-8 lg:p-10">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-primary-600 rounded-full animate-ping"></div>
            </div>
            <div className="text-center">
              <p className="text-primary-800 font-semibold text-lg">
                Processing your donation
              </p>
              <p className="text-neutral-600 text-sm mt-1">
                Please wait while we verify your payment details...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation */}
      {submissionSuccess && (
        <div className="mt-8 max-w-lg mx-auto bg-gradient-to-br from-green-50 to-white rounded-3xl shadow-sm border border-green-200 p-8 lg:p-10 relative overflow-hidden">
          {/* Celebratory Background */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full opacity-50 -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full opacity-50 translate-y-12 -translate-x-12"></div>
          </div>

          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-primary-800">
                Thank You for Supporting {payeeDisplayName}!
              </h3>
              <p className="text-neutral-600">
                {submittedData?.status === "verified"
                  ? `Your contribution to ${payeeDisplayName} has been successfully recorded.`
                  : `Your donation to ${payeeDisplayName} has been recorded and is under approval process.`}
              </p>
              {submittedData?.status === "pending_verification" && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm max-w-xl mx-auto">
                  <p className="font-medium">
                    Once our team approves your donation, it will be available publicly. We have saved your transaction ID for manual verification.
                  </p>
                </div>
              )}
            </div>

            {/* Donation Summary Card */}
            <div className="bg-white rounded-2xl p-6 shadow-inner border border-green-100 mb-6">
              <h4 className="font-semibold text-primary-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Donation Summary
              </h4>

              <div className="space-y-3">
                {/* Amount Display */}
                <div className="bg-primary-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary-800">
                    ₹{submittedData?.amount}
                  </div>
                  <div className="text-sm text-primary-600 mt-1">Donation Amount</div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-neutral-500 text-xs mb-1">Donor Name</p>
                    <p className="text-neutral-800 font-medium">{submittedData?.name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-neutral-500 text-xs mb-1">Transaction ID</p>
                    <p className="text-neutral-800 font-medium break-all">{submittedData?.transactionId}</p>
                  </div>
                  {submittedData?.phone && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-neutral-500 text-xs mb-1">Phone</p>
                      <p className="text-neutral-800 font-medium">{submittedData.phone}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-neutral-500 text-xs mb-1">Status</p>
                    <p className={`font-medium ${submittedData?.status === "verified" ? "text-green-700" : "text-amber-700"}`}>
                      {submittedData?.status === "verified" ? "Verified" : "Pending Verification"}
                    </p>
                  </div>
                </div>

                {/* Receipt Processing Status */}
                {submittedData?.receiptData && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-700 font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Receipt Processed
                      </span>
                      <span className="text-green-600">
                        {(submittedData.receiptData.confidence || 0) * 100}% Confidence
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-center">
              <p className="text-neutral-600 mb-6">
                We&apos;ll send you a confirmation email shortly. Thank you for making a difference!
              </p>
              <button
                onClick={() => {
                  setSubmissionSuccess(false);
                  setSubmittedData(null);
                }}
                className="inline-flex items-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors duration-200"
              >
                Make Another Donation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}