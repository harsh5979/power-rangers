# -----------------------------
# Predict Marks (Trend)
# -----------------------------
def predict_marks(marks):
    n = len(marks)
    slope = (marks[-1] - marks[0]) / n
    return marks[-1] + slope


# -----------------------------
# Current Risk Calculation
# -----------------------------
def calculate_current_risk(student):
    MARKS_WEIGHT = 50
    ASSIGNMENT_WEIGHT = 30
    ATTENDANCE_WEIGHT = 20
    PASSING_MARKS = 40

    # Attendance
    attendance = student["attendance"] / 100
    attendance_risk = ATTENDANCE_WEIGHT * (1 - attendance)

    # Assignment
    if student["assignment_status"] == "approved":
        assignment_risk = 0
    else:
        assignment_risk = ASSIGNMENT_WEIGHT

    # Marks
    marks = student["marks"]

    if marks < PASSING_MARKS:
        marks_risk = MARKS_WEIGHT
    else:
        performance_ratio = (marks - PASSING_MARKS) / (100 - PASSING_MARKS)
        marks_risk = MARKS_WEIGHT * (1 - performance_ratio)

    total_risk = attendance_risk + assignment_risk + marks_risk
    return round(total_risk, 2)


# -----------------------------
# Future Risk Calculation
# -----------------------------
def calculate_future_risk(student):
    MARKS_WEIGHT = 50
    ASSIGNMENT_WEIGHT = 30
    ATTENDANCE_WEIGHT = 20
    PASSING_MARKS = 40

    # Predict Marks
    predicted_marks = predict_marks(student["marks_history"])

    if predicted_marks < PASSING_MARKS:
        marks_risk = MARKS_WEIGHT
    else:
        performance_ratio = (predicted_marks - PASSING_MARKS) / (100 - PASSING_MARKS)
        marks_risk = MARKS_WEIGHT * (1 - performance_ratio)

    # Attendance (average)
    avg_attendance = sum(student["attendance_history"]) / len(student["attendance_history"])
    attendance_risk = ATTENDANCE_WEIGHT * (1 - avg_attendance / 100)

    # Assignment (behavior)
    assignment_score = sum(student["assignment_history"]) / len(student["assignment_history"])
    assignment_risk = ASSIGNMENT_WEIGHT * (1 - assignment_score)

    total_risk = marks_risk + attendance_risk + assignment_risk

    return round(total_risk, 2), round(predicted_marks, 2)


# -----------------------------
# Risk Level Label
# -----------------------------
def get_risk_level(risk):
    if risk >= 70:
        return "High Risk"
    elif risk >= 40:
        return "Medium Risk"
    else:
        return "Low Risk"


# -----------------------------
# Dummy Data
# -----------------------------
students = [
    {
        "name": "A",
        "marks": 75,
        "attendance": 80,
        "assignment_status": "approved",
        "marks_history": [80, 78, 75],
        "attendance_history": [85, 82, 80],
        "assignment_history": [1, 1, 1]
    },
    {
        "name": "B",
        "marks": 35,
        "attendance": 60,
        "assignment_status": "rejected",
        "marks_history": [50, 45, 35],
        "attendance_history": [70, 65, 60],
        "assignment_history": [1, 0, 0]
    },
    {
        "name": "C",
        "marks": 55,
        "attendance": 90,
        "assignment_status": "approved",
        "marks_history": [60, 58, 55],
        "attendance_history": [92, 91, 90],
        "assignment_history": [1, 1, 0]
    }
]


# -----------------------------
# Run Analysis
# -----------------------------
for s in students:
    current_risk = calculate_current_risk(s)
    future_risk, predicted_marks = calculate_future_risk(s)

    print(f"\nStudent: {s['name']}")
    print(f"Current Risk: {current_risk}% ({get_risk_level(current_risk)})")
    print(f"Predicted Marks: {predicted_marks}")
    print(f"Future Risk: {future_risk}% ({get_risk_level(future_risk)})")

    if predicted_marks < 40:
        print("⚠️ Likely to FAIL in future")