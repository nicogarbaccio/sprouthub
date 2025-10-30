# Weather Mood Messages Configuration

## Overview

This file (`weatherMoodMessages.ts`) contains **all the copy** for the Weather Mood Banner. Edit this file to customize messages, advice, colors, and animations without touching any service logic.

## Quick Edit Guide

### Adding New Messages

Simply add to the `messages` array for any mood:

```typescript
perfect: {
  messages: [
    "Perfect weather for plant parents! ☀️",
    "Your plants are living their best life today!",
    "YOUR NEW MESSAGE HERE! 🌟",  // ← Add your message
  ],
  // ...
}
```

### Adding New Advice

Add to the `advice` array:

```typescript
perfect: {
  // ...
  advice: [
    "Great day for checking on outdoor plants",
    "Perfect time for propagation or repotting",
    "YOUR NEW ADVICE HERE",  // ← Add your advice
  ],
  // ...
}
```

### Using Placeholders

Use these placeholders in your messages - they'll be automatically replaced:

- `{temp}` - Current temperature (e.g., "It's {temp}°C outside!" → "It's 25°C outside!")
- `{rainProb}` - Rain probability (e.g., "{rainProb}% chance of rain!" → "70% chance of rain!")
- `{humidity}` - Humidity percentage (e.g., "{humidity}% humidity" → "55% humidity")

Example:
```typescript
hotSunny: {
  messages: [
    "Sizzling {temp}°C outside! 🌞",  // ← Will show actual temp
    "It's a scorcher at {temp} degrees!",
  ],
  // ...
}
```

### Changing Colors/Gradients

Each mood has a `gradient` property. Use any CSS gradient:

```typescript
perfect: {
  // ...
  gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  // Change to: "linear-gradient(135deg, #yourColor1 0%, #yourColor2 100%)",
}
```

### Changing Animations

Available animations:
- `'perfect'` - Twinkling sparkles
- `'sunny'` - Rising heat circles
- `'hot'` - Rising heat circles (same as sunny)
- `'rainy'` - Falling water droplets
- `'cold'` - Floating snowflakes
- `'cloudy'` - Drifting clouds

```typescript
rainy: {
  // ...
  animation: "rainy" as const,  // ← Change to any animation above
}
```

### Changing Emojis

Just change the `emoji` property:

```typescript
perfect: {
  // ...
  emoji: "✨",  // ← Change to any emoji
}
```

## Weather Mood Categories

### 1. Perfect
**When:** 18-24°C, 40-60% humidity, <30% rain
**Current Messages:** 7 variations
**Mood Level:** Excellent (5/5 bars)

### 2. Hot & Sunny
**When:** >28°C, <20% rain
**Current Messages:** 7 variations
**Mood Level:** Good (3/5) or Challenging (1/5) if >35°C

### 3. Rainy
**When:** >60% rain probability
**Current Messages:** 8 variations
**Mood Level:** Good (3/5 bars)

### 4. Cold
**When:** <10°C
**Current Messages:** 7 variations
**Mood Level:** Fair (2/5) or Challenging (1/5) if <0°C

### 5. Pleasant
**When:** 20-28°C, comfortable conditions
**Current Messages:** 7 variations
**Mood Level:** Great (4/5 bars)

### 6. Cool
**When:** 10-20°C, moderate
**Current Messages:** 7 variations
**Mood Level:** Good (3/5 bars)

### 7. Fair
**When:** Normal/unremarkable conditions
**Current Messages:** 7 variations
**Mood Level:** Fair (2/5 bars)

## Special Event Alerts

Edit thresholds and messages for extreme conditions:

```typescript
specialEvents: {
  extremeHeat: {
    threshold: 38,  // ← Change temperature threshold
    message: "🔥 Extreme heat alert! Keep plants hydrated...",  // ← Edit message
  },
  freeze: {
    threshold: 0,  // ← Triggers when temp below this
    message: "❄️ Freeze warning! Protect sensitive plants...",
  },
  // ... more events
}
```

Available special events:
- **Extreme Heat** (default: >38°C)
- **Freeze Warning** (default: <0°C)
- **Perfect Storm** (ideal conditions)
- **Heavy Rain** (default: >80% probability)
- **Very Dry** (default: <20% humidity)
- **Very Humid** (default: >85% humidity)

## Time of Day Greetings

Customize greetings shown at different times:

```typescript
timeOfDay: {
  morning: {
    hours: [6, 7, 8, 9, 10, 11] as number[],
    message: "Good morning, plant parent! ☀️",  // ← Edit this
  },
  // ... more time periods
}
```

## Example Customizations

### Make it more casual:
```typescript
perfect: {
  messages: [
    "Yasss! Perfect plant weather! 🙌",
    "Chef's kiss weather today! 👨‍🍳💋",
    "10/10 would plant again! 🌿",
  ],
  advice: [
    "Go check on your green babies!",
    "Time to show your plants some love!",
  ],
  // ...
}
```

### Make it more technical:
```typescript
perfect: {
  messages: [
    "Optimal conditions detected: {temp}°C, {humidity}% RH",
    "Peak photosynthetic efficiency window",
  ],
  advice: [
    "Temperature and humidity within ideal ranges",
    "Conditions favorable for transpiration",
  ],
  // ...
}
```

### Add seasonal themes:
```typescript
perfect: {
  messages: [
    "Perfect spring day! 🌸",  // For spring
    "Peak summer vibes! ☀️",    // For summer
    "Crisp fall perfection! 🍂", // For fall
    "Cozy winter day! ❄️",      // For winter
  ],
  // ...
}
```

## Testing Your Changes

1. **Edit the config file** (`weatherMoodMessages.ts`)
2. **Save the file**
3. **Rebuild**: `npm run build`
4. **View on Dashboard** - Your changes will appear instantly!

## Tips

- 📝 **Keep messages concise** - They display in a banner
- 😊 **Use emojis** - They add personality and visual interest
- 🎯 **Be specific** - "Water more today" vs "Outdoor plants may need extra watering"
- ✅ **Test placeholders** - Make sure `{temp}`, `{rainProb}`, etc. make sense in context
- 🎨 **Match mood** - Keep messages aligned with the mood level (excellent/good/challenging)

## Current Message Counts

- Perfect: 7 messages, 6 advice tips
- Hot & Sunny: 7 messages, 6 advice tips
- Rainy: 8 messages, 6 advice tips
- Cold: 7 messages, 6 advice tips
- Pleasant: 7 messages, 6 advice tips
- Cool: 7 messages, 6 advice tips
- Fair: 7 messages, 6 advice tips

**Total:** 50 unique messages, 42 unique advice tips! 🎉

## Need Help?

Check out:
- **Main Documentation**: `/WEATHER_MOOD_BANNER.md`
- **Service Logic**: `/src/services/weatherMoodService.ts`
- **Banner Component**: `/src/components/WeatherMoodBanner.tsx`

---

Happy customizing! 🌱✨
