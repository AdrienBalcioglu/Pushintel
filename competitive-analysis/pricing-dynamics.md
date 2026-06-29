# Pricing Dynamics
**push-notifications-landscape · Adrien Balcioglu · June 2026**

---

## The structural problem with legacy pricing

Legacy pricing models index costs on **Monthly Active Users (MAUs)** or proprietary "data points" consumed. This creates a perverse incentive: the more data you collect, the higher your bill. Growth teams end up throttling data ingestion to control costs — the exact opposite of what good product analytics requires.

```
Legacy model:   High engagement = Higher bill  →  Incentivizes data throttling
Pushintel model: LLM tokens + delivery volume  →  Aligned with actual business value
```

---

## Pricing breakdown

### Braze
- No free tier
- Enterprise entry ticket: rarely below $30,000–$50,000/year
- Pricing combines MAUs, messaging volume, and proprietary "Data Points"
- Opaque — requires a sales call to get any figure
- **PM insight:** The Data Points system is a major pain point for clients. Every event attribute consumes points, which creates friction between product teams wanting richer tracking and finance teams managing the bill.

### Airship
- High-end enterprise pricing, fully opaque
- Costs scale aggressively with feature gates (in-app messaging, mobile wallet) and user tiers
- No self-serve option
- **PM insight:** Airship's pricing punishes companies whose engagement grows — the opposite of what a growth tool should do.

### OneSignal
- Most aggressive freemium model in the market
- Free tier: generous (popular with startups and indie developers)
- Paid tiers: Growth ~$19/mo, Professional ~$99/mo, scaling by subscriber count
- **PM insight:** OneSignal wins on accessibility but loses on power. Advanced behavioral triggers and segmentation are locked behind plans that quickly become expensive at scale.

### Pushintel
- Billed on **LLM tokens consumed** (management layer) + **raw delivery volume**
- No penalty for storing large inactive or low-activity user profiles
- No "data points" tax — full event richness is always free
- **PM insight:** This model directly removes the data throttling incentive. Growth marketers can segment hyper-densely without worrying that richer data = higher infrastructure bill.

---

## Pricing positioning map

```
                    HIGH PRICE
                         │
              Braze ●    │    ● Airship
                         │
LOW POWER ───────────────┼─────────────── HIGH POWER
                         │
         OneSignal ●     │
                         │         ● Pushintel (target)
                    LOW PRICE
```

Pushintel's opportunity: **high power at accessible price** — a quadrant currently unoccupied.
