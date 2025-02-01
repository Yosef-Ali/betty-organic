# Betty Organic App Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Mobile-First Design](#mobile-first-design)
4. [Component Structure](#component-structure)
5. [Styling Guidelines](#styling-guidelines)
6. [Best Practices](#best-practices)

## Introduction
Betty Organic App is a modern e-commerce platform built with Next.js, focusing on organic products. This guide provides comprehensive information about the application's structure, components, and development practices.

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Mobile-First Design
Our application follows a mobile-first approach with responsive design patterns:

### Card Layout Pattern
For mobile views, we transform table rows into card layouts:

```jsx
<div className="card p-4 shadow rounded border w-full space-y-4">
  <!-- Content sections -->
</div>
```

### Common Mobile Patterns
1. **User Info Section**:
   ```jsx
   <div className="flex items-center gap-3">
     <Avatar />
     <div className="space-y-2">
       <Name />
       <SubInfo />
     </div>
   </div>
   ```

2. **Content Sections**:
   ```jsx
   <div className="space-y-2">
     <Label />
     <Content />
   </div>
   ```

3. **Action Buttons**:
   ```jsx
   <div className="flex gap-2 pt-3">
     <Button className="flex-1" />
   </div>
   ```

## Component Structure
Components are organized into the following categories:
- UI Components (/components/ui)
- Layout Components (/components/layout)
- Feature Components (/components/features)
- Page Components (/app)

## Styling Guidelines
We use a combination of:
- Tailwind CSS for utility classes
- CSS Modules for component-specific styles
- Global styles for common patterns

### Key Utility Classes
- `space-y-4`: Vertical spacing between sections
- `space-y-2`: Vertical spacing between elements
- `gap-3`: Horizontal spacing
- `flex items-center`: Vertical alignment
- `w-full`: Full width
- `rounded`: Rounded corners
- `shadow`: Box shadow
- `border`: Card borders

## Best Practices
1. **Mobile-First Development**
   - Start with mobile layout
   - Add breakpoints for larger screens
   - Use responsive utility classes

2. **Component Organization**
   - Keep components small and focused
   - Use consistent naming conventions
   - Implement proper TypeScript types

3. **Performance**
   - Optimize images
   - Implement lazy loading
   - Use proper caching strategies

4. **Accessibility**
   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain proper contrast ratios

## Contributing
1. Create a feature branch
2. Follow coding standards
3. Write tests
4. Submit pull request

## Additional Resources
- [Auth Guide](./docs/auth-guide.md)
- [Next.js + Supabase Guide](./docs/nextjs-supabase-guide.md)
- [Profile Form Guide](./docs/profile-form-guide.md)
- [Release Guide](./docs/release-guide.md)
