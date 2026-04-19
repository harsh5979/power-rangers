def calculate_risk(student):
    # Weights
    MARKS_WEIGHT = 50
    ASSIGNMENT_WEIGHT = 30
    ATTENDANCE_WEIGHT = 20
    PASSING_MARKS = 40

    # -------------------
    # Attendance Risk
    # -------------------
    attendance = student["attendance"] / 100
    attendance_risk = ATTENDANCE_WEIGHT * (1 - attendance)

    # -------------------
    # Assignment Risk
    # -------------------
    if student["assignment_status"] == "approved":
        assignment_risk = 0
    else:
        assignment_risk = ASSIGNMENT_WEIGHT

    # -------------------
    # Marks Risk
    # -------------------
    marks = student["marks"]

    if marks < PASSING_MARKS:
        marks_risk = MARKS_WEIGHT
    else:
        performance_ratio = (marks - PASSING_MARKS) / (100 - PASSING_MARKS)
        marks_risk = MARKS_WEIGHT * (1 - performance_ratio)

    # -------------------
    # Total Risk
    # -------------------
    total_risk = attendance_risk + assignment_risk + marks_risk

    return round(total_risk, 2)


# -------------------
# Dummy Data
# -------------------
students = [
    {"name": "A", "marks": 75, "attendance": 80, "assignment_status": "approved"},
    {"name": "B", "marks": 35, "attendance": 60, "assignment_status": "rejected"},
    {"name": "C", "marks": 55, "attendance": 90, "assignment_status": "approved"},
    {"name": "D", "marks": 45, "attendance": 50, "assignment_status": "not_submitted"},
]

# -------------------
# Output
# -------------------
for s in students:
    risk = calculate_risk(s)

    if risk >= 70:
        level = "High Risk"
    elif risk >= 40:
        level = "Medium Risk"
    else:
        level = "Low Risk"

    print(f"{s['name']} → Risk: {risk}% ({level})")