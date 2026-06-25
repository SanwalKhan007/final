import blackShirt from "@/assets/black-shirt.jpg";
import formalSuit from "@/assets/formal-suit.jpg";
import denimJacket from "@/assets/denim-jacket.jpg";
import heroShirt from "@/assets/hero-shirt.jpg";
import heroSuit from "@/assets/hero-suit.jpg";
import heroDenim from "@/assets/hero-denim.jpg";

export type Product = {
  id: string;
  name: string;
  detail: string;
  sku: string;
  price: number;
  image: string;
  images: string[];
  fabric: string;
  color: string;
  sizes: string[];
  description: string;
};

export const PRODUCTS: Product[] = [
  {
    id: "shirt",
    name: "Black Essential Shirt",
    detail: "Fine Poplin Cotton",
    sku: "SHIRT_BLK_42",
    price: 2500,
    image: blackShirt,
    images: [blackShirt, heroShirt, formalSuit],
    fabric: "Fine Poplin Cotton",
    color: "Jet Black",
    sizes: ["S", "M", "L", "XL"],
    description:
      "A wardrobe cornerstone cut from compact-weave poplin for a clean drape and a sharp collar that holds its shape all day. Tailored regular fit through the chest and waist, finished with mother-of-pearl buttons and a single-needle topstitch for a precise silhouette under blazers or worn open over a tee.",
  },
  {
    id: "suit",
    name: "Charcoal Formal Suit",
    detail: "Super 120s Wool",
    sku: "SUIT_CHRL_50",
    price: 8000,
    image: formalSuit,
    images: [formalSuit, heroSuit, blackShirt],
    fabric: "Super 120s Wool",
    color: "Charcoal Grey",
    sizes: ["S", "M", "L", "XL"],
    description:
      "A two-piece tailored in Super 120s Italian wool with a half-canvas construction for a sculpted shoulder and natural drape. Notch lapels, dual side vents, and a tapered trouser cut to break cleanly over leather shoes — built for boardrooms, weddings, and every formal occasion in between.",
  },
  {
    id: "denim",
    name: "Selvedge Denim Jacket",
    detail: "14oz Indigo Raw",
    sku: "DENIM_IND_M",
    price: 5000,
    image: denimJacket,
    images: [denimJacket, heroDenim, blackShirt],
    fabric: "14oz Raw Selvedge Denim",
    color: "Deep Indigo",
    sizes: ["S", "M", "L", "XL"],
    description:
      "Heavyweight 14oz raw selvedge denim from a Japanese mill, sanforized for minimal shrinkage and built to age with you. Classic Type III silhouette: pointed flap chest pockets, copper rivets, and a chain-stitched hem that will fade to a personal indigo signature with wear.",
  },
];

export const fmt = (n: number) => `Rs.${n.toLocaleString("en-IN")}`;
