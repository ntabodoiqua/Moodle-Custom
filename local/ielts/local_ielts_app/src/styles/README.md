# Design System - IELTS Application

Hệ thống design tokens đồng bộ cho toàn bộ ứng dụng IELTS Mock Test.

## Cấu trúc

```
src/styles/
├── colors.ts       # Bảng màu
├── typography.ts   # Font chữ, kích thước, weights
├── spacing.ts      # Khoảng cách, border radius, shadows
├── theme.ts        # Tổng hợp tất cả design tokens
└── variables.css   # CSS variables (có thể dùng trực tiếp trong CSS)
```

## Cách sử dụng

### 1. Sử dụng trong TypeScript/React

```typescript
import { theme } from "@/styles/theme";
// hoặc
import { colors, typography, spacing } from "@/styles/theme";

// Ví dụ
const styles = {
  color: theme.colors.primary[600],
  fontSize: theme.fontSizes.lg,
  padding: theme.spacing[4],
  borderRadius: theme.borderRadius.md,
};
```

### 2. Sử dụng trong CSS/CSS Modules

```css
.button {
  background-color: var(--color-primary-600);
  color: var(--color-text-inverse);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--radius-base);
  transition: var(--transition-base);
}

.button:hover {
  background-color: var(--color-primary-700);
}
```

## Design Tokens

### Colors

- **Primary**: Blue tones (#2563eb) - Màu chính của brand
- **Success**: Green tones (#16a34a) - Trạng thái thành công
- **Warning**: Yellow tones (#eab308) - Cảnh báo
- **Error**: Red tones (#dc2626) - Lỗi
- **Gray**: Neutral tones - Text, borders, backgrounds

### Typography

- **Font family**: System font stack (sans), Monospace (mono)
- **Font sizes**: xs (12px) → 6xl (36px)
- **Font weights**: normal (400), medium (500), semibold (600), bold (700)
- **Line heights**: tight (1.25) → loose (1.8)

### Spacing

- **Scale**: 0 (0px) → 24 (96px) - Theo hệ thống 4px
- **Border radius**: sm (4px) → full (9999px)
- **Shadows**: sm → 2xl
- **Z-index**: base (0) → tooltip (70)

## Best Practices

1. **Luôn sử dụng design tokens** thay vì hardcode giá trị
2. **Dùng CSS variables** cho values có thể thay đổi runtime
3. **Dùng TypeScript constants** cho logic và computed styles
4. **Maintain consistency** - Giữ nhất quán trong toàn bộ ứng dụng

## Examples

### Button Component

```typescript
import { theme } from "@/styles/theme";

const buttonStyles = {
  primary: {
    backgroundColor: theme.brandColors.primary,
    color: theme.colors.text.inverse,
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
    borderRadius: theme.borderRadius.base,
  },
};
```

### Card Component (CSS)

```css
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-md);
}
```
