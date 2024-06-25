import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import { THIS_ENDPOINT } from "../../globals";

const OrderQR = (orderId) => {
    const canvasRef = useRef(null);

    // Link to the order page
    const orderLink = THIS_ENDPOINT + `/order/${orderId.orderId}`;

    // Generate QR code
    useEffect(() => {
        if (orderId) {
            QRCode.toCanvas(canvasRef.current, orderLink, { errorCorrectionLevel: 'H' }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [orderId, orderLink]);

    return (
        <a href={orderLink}>
            <canvas ref={canvasRef} className="border rounded-lg mb-4"></canvas>
        </a>
    )
}

export default OrderQR;