import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

type Props = {
  value: string;
  height?: number;
  width?: number;
  displayValue?: boolean;
  className?: string;
  background?: string;
  lineColor?: string;
  fontSize?: number;
  margin?: number;
};

export default function Barcode({
  value,
  height = 40,
  width = 1.4,
  displayValue = true,
  className,
  background = "transparent",
  lineColor = "#000000",
  fontSize = 11,
  margin = 0,
}: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !value) return;
    try {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        height,
        width,
        displayValue,
        background,
        lineColor,
        fontSize,
        margin,
        font: "monospace",
      });
    } catch {
      // ignore invalid values
    }
  }, [value, height, width, displayValue, background, lineColor, fontSize, margin]);

  return <svg ref={ref} className={className} aria-label={`Barcode ${value}`} />;
}
