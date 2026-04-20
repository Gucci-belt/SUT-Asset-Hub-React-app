# SUT Asset Hub - Design System

## Overview & Creative North Star

### The Digital Curator

This design system adopts the persona of **"The Digital Curator,"** moving away from utilitarian aesthetics to treat high-value university assets as objects of importance. It uses generous whitespace, editorial typography, and sophisticated layering to create a sense of trust and prestige.

The design emphasizes **Tonal Depth** and **Intentional Asymmetry**. Instead of rigid grids and solid borders, it relies on a fluid "sheet-on-sheet" approach using subtle background shifts and atmospheric lighting to establish hierarchy.

---

## Typography

- **Font Family:** Inter
- **Headlines & Display:** Inter (`display-md` / 2.75rem). Used for "Hero" moments and empty states for an editorial impact.
- **Titles:** Inter (`title-lg` / 1.375rem). Serves as the primary navigation anchor for cards.
- **Body:** Inter (`body-md` / 0.875rem). Provides high legibility with generous line-height for reading asset descriptions.
- **Labels:** Inter (`label-sm` / 0.6875rem). Used for "Overdue" or "Available" tags. Set in All-Caps with +5% letter spacing to stand out.

---

## Color Palette (Light Mode)

### Core Colors

- **Primary:** `#004ac6` (Deep authoritative blue)
- **Primary Container:** `#2563eb` (Vibrant azure)
- **Secondary:** `#0061a5`
- **Tertiary:** `#2c4bb9`

### Surface & Background (Level Hierarchy)

- **Level 0 (Base):** `surface` `#f8f9ff` — The foundation.
- **Level 1 (Sections):** `surface_container_low` `#eff4ff` — Large content areas.
- **Level 2 (Interaction):** `surface_container_lowest` `#ffffff` — Actionable cards and inputs.
- **Surface Bright:** `#f8f9ff`
- **Surface Container Highest:** `#d3e4fe`

### Text & On-Colors

- **On Surface:** `#0b1c30` (Use instead of 100% black for premium contrast)
- **On Surface Variant:** `#434655`
- **On Primary:** `#ffffff`
- **On Secondary:** `#ffffff`

### State & Feedback Colors

- **Error:** `#ba1a1a`
- **Error Container:** `#ffdad6`
- **On Error:** `#ffffff`
- **On Error Container:** `#93000a`
- **Outline:** `#737686`
- **Outline Variant:** `#c3c6d7` (Used at 15% opacity for faint "Ghost Borders")

---

## Shape & Elevation

- **Roundness Base:** `ROUND_EIGHT` (8px base)
- **Buttons:** `xl` roundedness (1.5rem / 24px).
- **Form Inputs:** `md` roundedness (0.75rem / 12px).
- **Cards:** `xl` roundedness. No solid borders, rely on tonal shifts or `outline_variant` at 15% opacity.
- **Ambient Shadow (Floating Elements):** `0px 20px 40px rgba(11, 28, 48, 0.06)`. Natural shadow tinted with `on_surface`.
- **Glassmorphism:** Use `surface_container_highest` with 70% opacity and a `20px` backdrop-blur for floating elements.

---

## Component Guidelines

- **Primary Buttons:** Gradient of `primary` to `primary_container`. No shadow.
- **Cards:** Use 1.5rem (xl) padding. Use vertical whitespace instead of divider lines to separate content.
- **Asset Status Chips:**
  - _Available:_ Secondary fixed background with contrasting text.
  - _In-Use/Overdue:_ Error container background with on-error text.
- **Form Inputs:** `surface_container_low` background when default. In focus, switch to `surface_container_lowest` with a 1px primary border at 40% opacity.

---

## Key Do's and Don'ts

### Do

- Use asymmetrical layouts in Hero sections.
- Prioritize high-quality photography as the focal point.
- Use `surface_container` tokens to establish "zones" instead of drawing harsh lines.

### Don't

- Don't use generic drop shadows (keep it "ambient").
- Don't use 100% black `#000000` for text; rely on the `#0b1c30` on-surface color.
- Don't use 1px solid borders for sectioning or list item separation. Use spacing instead.

### State & Feedback Colors (UPDATED)

- **Success (Available):** `#008a2e` (สีเขียว สำหรับของที่ว่าง)
- **Success Container:** `#e6f4ea` (พื้นหลังสีเขียวอ่อน)
- **Warning (Borrowed/Overdue):** `#e67c00` (สีส้ม สำหรับของที่ถูกยืมหรือเลยกำหนด)
- **Warning Container:** `#fff3e0` (พื้นหลังสีส้มอ่อน)
- **Error:** `#ba1a1a`
- **Error Container:** `#ffdad6`

---

## Component Guidelines (UPDATED)

- **Asset Status Chips:**
  - _Available:_ ใช้พื้นหลัง `Success Container` และตัวหนังสือ `Success`
  - _Borrowed/Overdue:_ ใช้พื้นหลัง `Warning Container` และตัวหนังสือ `Warning`
