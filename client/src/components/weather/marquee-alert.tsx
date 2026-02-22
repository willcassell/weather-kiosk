import { AlertTriangle } from "lucide-react";

interface WeatherAlert {
    id: string;
    event: string;
    severity: string;
    headline: string;
}

interface MarqueeAlertProps {
    alerts: WeatherAlert[];
}

export default function MarqueeAlert({ alerts }: MarqueeAlertProps) {
    if (!alerts || alerts.length === 0) return null;

    // Filter out minor/unknown alerts if desired, but for now show all fetched active alerts
    const alertText = alerts
        .map((a) => `${a.event.toUpperCase()}${a.headline ? `: ${a.headline}` : ''}`)
        .join(" • ");

    return (
        <div className="bg-red-600 text-white w-full overflow-hidden flex items-center py-1 md:py-1.5 px-2 md:px-4 font-semibold text-xs md:text-sm">
            <div className="flex-shrink-0 mr-3 flex items-center animate-pulse z-10 bg-red-600 pr-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="tracking-wide">WEATHER ALERT</span>
            </div>

            <div className="relative flex-1 overflow-hidden h-6 flex items-center">
                {/* The marquee span needs to have enough width to scroll. We use inline style animation for simplicity, or tailor it with a class */}
                <div
                    className="whitespace-nowrap animate-marquee"
                >
                    {alertText}
                </div>
            </div>
        </div>
    );
}
