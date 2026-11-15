# Dataset Provenance & Metadata Documentation

## 1. Overview
This document specifies the origin, schema, statistical distributions, and validation methodology for the historical YouTube performance dataset (`training_data.csv`) used to train and benchmark TutorTrace predictive models.

- **Primary Target Variable:** `views` (Total 30-day view count post-upload).
- **Total Record Count:** 1,200 video observations.
- **Evaluation Split:** 960 training samples (80%) / 240 held-out test samples (20%).
- **Domain:** Technical education, programming tutorials, and software engineering channels.

---

## 2. Feature Schema & Statistical Distributions

| Feature Name | Data Type | Value Range | Distribution Characteristics | Description |
| :--- | :--- | :--- | :--- | :--- |
| `title_length` | Integer | 15 – 100 chars | Normal ($\mu=52, \sigma=18$) | Character count of video title. Optimal range is 40–70 chars. |
| `description_length`| Integer | 50 – 2,500 chars | Exponential ($\mu=350$) | Character count of video description. |
| `tag_count` | Integer | 2 – 45 tags | Poisson ($\lambda=14$) | Number of metadata keywords/tags attached to the upload. |
| `category_id` | Integer | [10, 22, 24, 27, 28]| Categorical multinomial | YouTube category ID (22: People/Blogs, 27: Education, 28: Science/Tech). |
| `trending_match_score`| Integer | 0 – 10 terms | Poisson ($\lambda=2.5$) | Count of video title n-grams matching current regional top-10 trending titles. |
| `avg_competitor_views`| Integer | 1,500 – 1,200,000 | Lognormal ($\mu=10.5, \sigma=1.2$)| Average view count of top-5 competing videos in the same sub-topic. |
| `sentiment_score` | Float | -0.20 to +0.80 | Uniform | TextBlob comment polarity score sampled from initial comments. |
| `engagement_rate_estimate`| Float | 0.5% – 18.0% | Beta ($\alpha=2, \beta=25$) | Estimated engagement ratio: $\frac{\text{likes} + \text{comments}}{\text{views}} \times 100$. |
| `similar_video_count`| Integer | 3 – 5 videos | Discrete uniform | Number of direct competitor uploads within the search window. |
| `views` (Target) | Integer | 500 – 2,800,000 | Right-skewed power law | Actual 30-day video view count. |

---

## 3. Preprocessing & Leakage Prevention
1. **Zero Data Leakage:** All feature scaling (`StandardScaler`) is fitted strictly on the 80% training split (`X_train`) and applied downstream to the 20% test split (`X_test`).
2. **Deterministic Reproducibility:** Train/test splits and random seeds are locked to `random_state=42`.
3. **Artifact Serialization:** Serialized scaler parameters are saved to `feature_scaler.pkl` to ensure identical production inference scaling.
