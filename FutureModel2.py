# -----------------------------
# Predict Marks (Trend)
# -----------------------------
def predict_marks(marks):
    n = len(marks)
    if n < 2:
        return marks[-1]  # no trend possible

    slope = (marks[-1] - marks[0]) / n
    return marks[-1] + slope


# -----------------------------
# Risk Calculation (Reusable)
# -----------------------------
def calculate_risk(marks, attendance, assignment_score):
    MARKS_WEIGHT = 50
    ATTENDANCE_WEIGHT = 20
    ASSIGNMENT_WEIGHT = 30
    PASSING_MARKS = 40

    # ---- Marks Risk ----
    if marks < PASSING_MARKS:
        marks_risk = MARKS_WEIGHT
    else:
        performance_ratio = (marks - PASSING_MARKS) / (100 - PASSING_MARKS)
        marks_risk = MARKS_WEIGHT * (1 - performance_ratio)

    # ---- Attendance Risk ----
    attendance_risk = ATTENDANCE_WEIGHT * (1 - attendance / 100)

    # ---- Assignment Risk ----
    assignment_risk = ASSIGNMENT_WEIGHT * (1 - assignment_score)

    total_risk = marks_risk + attendance_risk + assignment_risk
    return round(total_risk, 2)


# -----------------------------
# Combined Analysis
# -----------------------------
def analyze_student(student):
    # CURRENT VALUES
    current_marks = student["marks_history"][-1]
    current_attendance = student["attendance_history"][-1]

    assignment_score = sum(student["assignment_history"]) / len(student["assignment_history"])

    # CURRENT RISK
    current_risk = calculate_risk(
        current_marks,
        current_attendance,
        assignment_score
    )

    # FUTURE PREDICTION
    predicted_marks = predict_marks(student["marks_history"])

    avg_attendance = sum(student["attendance_history"]) / len(student["attendance_history"])

    # FUTURE RISK
    future_risk = calculate_risk(
        predicted_marks,
        avg_attendance,
        assignment_score
    )

    return {
        "name": student["name"],
        "current_risk": current_risk,
        "future_risk": future_risk,
        "predicted_marks": round(predicted_marks, 2)
    }


# -----------------------------
# Dummy Data
# -----------------------------
students = [
    {
        "name": "A",
        "marks_history": [70, 65, 60],
        "attendance_history": [85, 80, 75],
        "assignment_history": [1, 1, 0]
    },
    {
        "name": "B",
        "marks_history": [50, 45, 35],
        "attendance_history": [70, 65, 60],
        "assignment_history": [1, 0, 0]
    },
    {
        "name": "C",
        "marks_history": [80, 82, 85],
        "attendance_history": [90, 92, 95],
        "assignment_history": [1, 1, 1]
    }
]


# -----------------------------
# Output
# -----------------------------
for student in students:
    result = analyze_student(student)

    def risk_level(r):
        if r >= 70:
            return "High Risk"
        elif r >= 40:
            return "Medium Risk"
        else:
            return "Low Risk"

    print(f"\nStudent: {result['name']}")
    print(f"Current Risk: {result['current_risk']}% ({risk_level(result['current_risk'])})")
    print(f"Predicted Marks: {result['predicted_marks']}")
    print(f"Future Risk: {result['future_risk']}% ({risk_level(result['future_risk'])})")

    if result["predicted_marks"] < 40:
        print("⚠️ Likely to FAIL in future")
    else:
        print("✅ Likely to PASS")