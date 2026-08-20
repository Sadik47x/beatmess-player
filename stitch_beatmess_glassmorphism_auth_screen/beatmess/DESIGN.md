---
name: BeatMess
colors:
  surface: '#131318'
  surface-dim: '#131318'
  surface-bright: '#39383e'
  surface-container-lowest: '#0e0e13'
  surface-container-low: '#1b1b20'
  surface-container: '#1f1f25'
  surface-container-high: '#2a292f'
  surface-container-highest: '#35343a'
  on-surface: '#e4e1e9'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e4e1e9'
  inverse-on-surface: '#303036'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb0cd'
  on-secondary: '#640039'
  secondary-container: '#aa0266'
  on-secondary-container: '#ffbad3'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#909191'
  on-tertiary-container: '#282a2a'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffd9e4'
  secondary-fixed-dim: '#ffb0cd'
  on-secondary-fixed: '#3e0022'
  on-secondary-fixed-variant: '#8c0053'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#131318'
  on-background: '#e4e1e9'
  surface-variant: '#35343a'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '800'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  container-max: 1440px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 48px
  split-left: 55%
  split-right: 45%
---

## Brand & Style
The design system for this music streaming platform is built on a premium, immersive dark-mode aesthetic. It utilizes **Glassmorphism** as its core structural language, creating a sense of depth and luxury through translucent layers that feel like suspended panes of glass over a deep, dark void.

The target audience is design-conscious music lovers and audiophiles who value a sleek, nocturnal environment that lets album art and artist imagery pop. The emotional response is one of energy and sophistication, achieved through vibrant neon gradients contrasted against high-clarity frosted surfaces. The visual style is futuristic, clean, and highly tactile.

## Colors
This design system employs a "Deep Space" palette. The background is a near-black, high-density neutral (#0a0a0f) which provides the canvas for glass layers.

The primary visual driver is a **Violet-to-Pink gradient**, used for logos, primary CTAs, and active navigation states. Glass surfaces use a 6% white fill with a subtle 0.5px white border to define edges against the dark background. Feedback states like errors should use a high-saturation red with an outer glow to mimic neon signaling.

## Typography
The system uses a pairing of two modern sans-serifs. **Sora** provides a geometric, technical feel for headlines and display text, emphasizing the app's modern tech stack. **Hanken Grotesk** is used for body and labels to ensure maximum legibility at smaller sizes.

The logo and primary display headers should utilize the brand gradient fill. For standard text, use high-white (90% opacity) for primary content and mid-grey (60% opacity) for secondary information to maintain hierarchy within the glass layers.

## Layout & Spacing
The layout logic changes significantly between form factors to optimize for the user's focus.

- **Desktop**: A 55/45 split-screen layout is used. The left pane (55%) is for immersive content like player controls or artist visualizers. The right pane (45%) handles browsing, playlists, and social feeds.
- **Mobile**: A centered card layout is prioritized. Content is contained within glass modules with consistent 20px side margins.

Grid columns are fluid, but margins and gutters remain fixed to maintain a tight, technical look. Elements should be grouped into distinct glass containers rather than floating freely.

## Elevation & Depth
Depth is not communicated through shadows, but through **translucency and blur**. 

1. **Backdrop Blur**: All glass surfaces must apply a `20px` backdrop-blur filter. 
2. **Layering**: When one glass card is placed over another, the opacity of the top card remains at 6%, but the cumulative blur effect naturally separates the layers.
3. **Borders**: Each surface must have a 0.5px "inner-glow" style border (white at 12% opacity) to catch light and define the object's geometry.
4. **Active Elevation**: When an element is focused or hovered, increase the surface fill slightly to 10% or apply a subtle brand-colored outer glow (15px spread, 0.2 opacity).

## Shapes
This design system uses a pill-shaped language for high-interactivity elements and highly rounded corners for containers. 

Buttons, tab switchers, and tags are always fully pill-shaped (rounded-full). Cards and input fields use a consistent 1.5rem (24px) corner radius to create a soft, premium feel that offsets the technical, high-contrast colors.

## Components
- **Buttons**:
    - **Primary**: Full-width pill shape with the Violet-to-Pink gradient. Text should be white or high-contrast black depending on the specific gradient weight.
    - **Secondary**: Pill shape with a translucent glass fill and a 1px white border (20% opacity).
- **Tab Switchers**: Use a container-level glass background. The active state is a pill that slides underneath the text, filled with the brand gradient.
- **Input Fields**: 24px rounded corners. Translucent white fill (6%) with a soft border. On focus, the border color transitions to the primary violet accent.
- **Cards**: Large glass modules with 24px rounding. Content inside cards should follow the vertical spacing rhythm (16px/24px).
- **Error States**: Components in an error state receive a `0 0 10px rgba(255, 77, 77, 0.5)` outer glow and a thin red border. Error text is displayed in 12px Hanken Grotesk below the field.
- **Music Player**: A persistent glass bar at the bottom of the screen (on mobile) or integrated into the 55% pane (on desktop), featuring high-gloss icons and a gradient-filled progress bar.