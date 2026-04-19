def predict_marks(marks):
    n = len(marks)
    slope = (marks[-1] - marks[0]) / n
    return marks[-1] + slope


def calculate_future_risk(student):
    PASSING_MARKS = 40

    # -------------------
    # Marks Prediction
    # -------------------
    predicted_marks = predict_marks(student["marks_history"])

    if predicted_marks < PASSING_MARKS:
        marks_risk = 50
    else:
        performance_ratio = (predicted_marks - PASSING_MARKS) / (100 - PASSING_MARKS)
        marks_risk = 50 * (1 - performance_ratio)

    # -------------------
    # Attendance
    # -------------------
    avg_attendance = sum(student["attendance_history"]) / len(student["attendance_history"])
    attendance_risk = 20 * (1 - avg_attendance / 100)

    # -------------------
    # Assignments
    # -------------------
    assignment_score = sum(student["assignment_history"]) / len(student["assignment_history"])
    assignment_risk = 30 * (1 - assignment_score)

    total_risk = marks_risk + attendance_risk + assignment_risk

    return round(total_risk, 2), round(predicted_marks, 2)


# -------------------
# Dummy Student
# -------------------
student = {
    "name": "Rahul",
    "marks_history": [70, 65, 60],
    "attendance_history": [85, 80, 75],
    "assignment_history": [1, 1, 0]  # 1=approved, 0=not
}

risk, predicted_marks = calculate_future_risk(student)

print("Predicted Marks:", predicted_marks)
print("Future Risk:", risk)

if predicted_marks < 40:
    print("⚠️ Likely to FAIL")
else:
    print("✅ Likely to PASS")