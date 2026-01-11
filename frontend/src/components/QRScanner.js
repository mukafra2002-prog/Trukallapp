import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { QrCode, Camera, X, Copy, Share2, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export default function QRScanner({ onScan, referralCode }) {
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [showMyCode, setShowMyCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setScanning(true);
      
      // Start scanning frames
      scanFrame();
    } catch (error) {
      toast.error("Camera access denied. Please allow camera permission.");
      console.error(error);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const scanFrame = () => {
    if (!scanning || !videoRef.current) return;
    
    // Use BarcodeDetector API if available
    if ('BarcodeDetector' in window) {
      const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      
      const checkFrame = async () => {
        if (!scanning || !videoRef.current) return;
        
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes.length > 0) {
            handleScan(barcodes[0].rawValue);
            return;
          }
        } catch (e) {
          // Continue scanning
        }
        
        requestAnimationFrame(checkFrame);
      };
      
      checkFrame();
    } else {
      // Fallback - just show camera, manual entry needed
      toast.info("QR scanning limited on this browser. Use manual entry.");
    }
  };

  const handleScan = (result) => {
    setScannedResult(result);
    stopScanning();
    toast.success("QR Code scanned!");
    
    if (onScan) {
      onScan(result);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode || "");
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TrukAll!',
          text: `Use my referral code ${referralCode} to get 500 bonus points!`,
          url: `https://trukall.app/signup?ref=${referralCode}`
        });
      } catch (e) {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  const downloadQR = () => {
    const canvas = document.getElementById('referral-qr-code');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `trukall-referral-${referralCode}.png`;
      link.href = url;
      link.click();
      toast.success("QR code downloaded!");
    }
  };

  return (
    <div className="space-y-4">
      {/* Scanner Mode */}
      {scanning && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              Scanning...
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={stopScanning}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative aspect-square bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50"></div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                Point camera at QR code
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanned Result */}
      {scannedResult && !scanning && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Scanned Successfully!</p>
                <p className="text-sm text-green-600 break-all">{scannedResult}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!scanning && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={startScanning}
            className="h-auto py-4 bg-blue-600 hover:bg-blue-700"
            data-testid="scan-qr-btn"
          >
            <div className="flex flex-col items-center">
              <Camera className="w-6 h-6 mb-1" />
              <span>Scan QR Code</span>
            </div>
          </Button>
          
          <Button
            onClick={() => setShowMyCode(!showMyCode)}
            variant="outline"
            className="h-auto py-4"
            data-testid="show-my-qr-btn"
          >
            <div className="flex flex-col items-center">
              <QrCode className="w-6 h-6 mb-1" />
              <span>My QR Code</span>
            </div>
          </Button>
        </div>
      )}

      {/* My Referral QR Code */}
      {showMyCode && referralCode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Your Referral QR Code</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-inner">
              <QRCodeCanvas
                id="referral-qr-code"
                value={`https://trukall.app/signup?ref=${referralCode}`}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <div className="text-center">
              <Badge className="text-lg px-4 py-2 bg-blue-600">{referralCode}</Badge>
              <p className="text-sm text-slate-500 mt-2">
                Friends get 500 pts, you get 1000 pts!
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyCode} variant="outline" size="sm">
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button onClick={shareCode} variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button onClick={downloadQR} className="bg-blue-600" size="sm">
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
