# Cardpirates Project Rules

- **Mobile First Approach**: Always prioritize a Mobile-First approach in all design and implementation discussions. Interfaces should feel lightweight, legible, and completely optimized for small viewports first, expanding gracefully to desktop sizes. Avoid using small fonts (< 16px) on input fields to prevent automatic viewport zoom behaviors on mobile browsers. Ensure all tap targets are easily clickable (minimum 44x44 pixels) with proper padding.

- **Dynamic & Responsive Component Assessment**: For all new and updated components, always evaluate whether a layout, structure, or interaction should be dynamic between viewports. Ensure content is beautifully laid out on small screen sizes (e.g., using swiping, lists, and full-width layouts) but expands cleanly and proportionally on desktop sizes (using columns, grids, and fixed widths) without unexpected desktop layout side-effects. Use Tailwind's viewport prefixes (`sm:`, `md:`, `lg:`, `xl:`) or client-side screen width detection to conditionally alter rendering when responsive CSS alone is insufficient.

- **Automatic Git Push**: After successfully completing and verifying any requested coding task or implementation changes, always stage all modified files, create a concise and descriptive commit message following conventional commit guidelines, commit the changes, and push them to the remote Git repository before concluding your turn.

