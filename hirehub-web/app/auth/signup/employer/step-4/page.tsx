"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CloudUpload, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
// TODO: Import your actual mutation hook from authApi
import { useSetupEmployerVerificationMutation } from "@/redux/services/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { setTempToken } from "@/redux/authSlice";

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null) {
    const maybeData = (err as { data?: { message?: unknown } }).data;
    if (maybeData && typeof maybeData.message === "string") return maybeData.message;

    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string") return maybeMessage;
  }
  return fallback;
}

export default function EmployerStep4Verification() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const[idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const[setupVerification, { isLoading }] = useSetupEmployerVerificationMutation();

  useEffect(() => {
    const backupToken = searchParams.get("backupToken");
    if (!backupToken) return;

    dispatch(setTempToken(backupToken));
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tempToken", backupToken);
    }
  }, [dispatch, searchParams]);

  const handleNext = async () => {
    setError("");

    if (!idFrontFile || !idBackFile || !selfieFile) {
      setError("Please upload all required documents.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("idCardFront", idFrontFile);
      formData.append("idCardBack", idBackFile);
      formData.append("selfieImage", selfieFile);

      await setupVerification(formData).unwrap();
      
      router.push("/auth/signup/employer/pending-approval");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Verification submission failed. Please try again."));
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraOpen(false);
  };

  const handleOpenCamera = async () => {
    setCameraError("");
    setError("");
    setIsStartingCamera(true);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Camera is not supported on this device/browser.");
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err: unknown) {
      setCameraError(getErrorMessage(err, "Unable to access camera. Please allow camera permission."));
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleCaptureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setCameraError("Camera is not ready yet. Please try again.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCameraError("Unable to capture image. Please try again.");
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("Unable to capture image. Please try again.");
          return;
        }

        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        if (selfiePreview) {
          URL.revokeObjectURL(selfiePreview);
        }

        setSelfieFile(file);
        setSelfiePreview(URL.createObjectURL(file));
        stopCamera();
      },
      "image/jpeg",
      0.92,
    );
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
  }, [stream, selfiePreview]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="w-full max-w-[1393px] bg-white rounded-[30px] shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        
        {/* Left Side */}
        <div className="relative w-full md:w-1/2 hidden md:block">
          <Image src="/image/jaimica7.webp" alt="Meeting" fill className="object-cover" priority />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[80%] bg-white/30 backdrop-blur-md p-6 rounded-2xl text-center text-white shadow-lg">
            <h3 className="text-2xl font-bold">Welcome to HireHubJA</h3>
            <p className="text-sm opacity-90 mt-1">Login to explore more</p>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full transition-all ${i === 4 ? "bg-[#3FAE2A] ring-2 ring-green-900/50 w-4" : "bg-white/50"}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full md:w-1/2 bg-[#EAF6EA] flex flex-col p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
          
          <Button variant="ghost" size="icon" className="absolute top-8 left-8 rounded-full bg-white shadow-sm hover:bg-gray-100 z-10" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>

          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="mb-2">
                <h2 className="text-base font-bold text-gray-800">Verification <span className="text-gray-400 font-normal">(Mandatory)</span></h2>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 text-sm w-full rounded">
                  {error}
                </div>
              )}
              
              <div className="space-y-5">
                
                {/* ID Front */}
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm font-medium">Government Id card(Front)</Label>
                  <label className="w-full bg-white rounded-xl border-2 border-dashed border-blue-100 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <CloudUpload className="w-8 h-8 text-gray-500 mb-2" />
                    <p className="text-sm font-bold text-gray-700">
                      {idFrontFile ? (
                        <span className="text-[#3FAE2A]">✓ {idFrontFile.name}</span>
                      ) : "Choose a file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG & JPEG formats, up to 50MB</p>
                    <div className="mt-3 px-4 py-1.5 border border-gray-200 rounded-md text-xs text-gray-500 font-medium">
                      Browse File
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)} 
                    />
                  </label>
                </div>

                {/* ID Back */}
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm font-medium">Government Id card(Back)</Label>
                  <label className="w-full bg-white rounded-xl border-2 border-dashed border-blue-100 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <CloudUpload className="w-8 h-8 text-gray-500 mb-2" />
                    <p className="text-sm font-bold text-gray-700">
                      {idBackFile ? (
                        <span className="text-[#3FAE2A]">✓ {idBackFile.name}</span>
                      ) : "Choose a file"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG & JPEG formats, up to 50MB</p>
                    <div className="mt-3 px-4 py-1.5 border border-gray-200 rounded-md text-xs text-gray-500 font-medium">
                      Browse File
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={(e) => setIdBackFile(e.target.files?.[0] || null)} 
                    />
                  </label>
                </div>

                {/* Selfie Capture with Camera */}
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm font-medium">Capture selfie to verify yourself</Label>
                  <button
                    type="button"
                    onClick={handleOpenCamera}
                    disabled={isStartingCamera}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:bg-gray-50 h-14 border border-transparent hover:border-[#3FAE2A] transition-all relative overflow-hidden disabled:opacity-70"
                  >
                    <span className="text-sm text-gray-500 font-medium z-10">
                      {selfieFile ? (
                        <span className="text-[#3FAE2A]">✓ {selfieFile.name || "Selfie Captured"}</span>
                      ) : isStartingCamera ? "Opening camera..." : "Capture selfie"}
                    </span>
                    <Camera className="w-6 h-6 text-gray-400 z-10" />
                  </button>
                  <p className="text-xs text-gray-400">Selfie must be captured using webcam/phone camera. Local file upload is disabled.</p>
                  {selfiePreview && (
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white mt-2">
                      <img src={selfiePreview} alt="Captured selfie preview" className="w-full h-44 object-cover" />
                    </div>
                  )}
                  {cameraError && (
                    <p className="text-xs text-red-500">{cameraError}</p>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Button onClick={handleNext} disabled={isLoading} className="w-full h-12 bg-[#3FAE2A] hover:bg-[#359624] rounded-full text-lg font-bold shadow-lg shadow-green-200/50 text-white">
                  {isLoading ? <Loader2 size={18} className="animate-spin mr-2" /> : null} Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Capture Selfie</h3>
            <div className="rounded-xl overflow-hidden bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-72 object-cover" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3 mt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={stopCamera}>
                Cancel
              </Button>
              <Button type="button" className="flex-1 bg-[#3FAE2A] hover:bg-[#359624] text-white" onClick={handleCaptureSelfie}>
                Capture
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
