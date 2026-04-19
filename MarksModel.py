import random

# -----------------------------
# Dummy Data Generator
# -----------------------------
def generate_dummy_students(num_students=10):
    students = []

    for i in range(1, num_students + 1):
        student = {
            "name": f"Student_{i}",
            "marks": random.randint(30, 100),          # out of 100
            "attendance": random.randint(50, 100),     # percentage
            "assignments": random.randint(40, 100)     # submission %
        }
        students.append(student)

    return students


# -----------------------------
# Risk Calculation Logic
# -----------------------------
def calculate_risk(student):
    score = 0

    # Marks weight
    if student["marks"] < 50:
        score += 2
    elif student["marks"] < 70:
        score += 1

    # Attendance weight
    if student["attendance"] < 60:
        score += 2
    elif student["attendance"] < 75:
        score += 1

    # Assignment weight
    if student["assignments"] < 60:
        score += 2
    elif student["assignments"] < 80:
        score += 1

    # Risk classification
    if score >= 5:
        return "High Risk"
    elif score >= 3:
        return "Medium Risk"
    else:
        return "Low Risk"


# -----------------------------
# Display Results
# -----------------------------
def analyze_students(students):
    print("\n--- Academic Risk Analysis ---\n")

    for student in students:
        risk = calculate_risk(student)

        print(f"Name: {student['name']}")
        print(f"Marks: {student['marks']}")
        print(f"Attendance: {student['attendance']}%")
        print(f"Assignments: {student['assignments']}%")
        print(f"Risk Level: {risk}")
        print("-" * 30)


# -----------------------------
# Main Program
# -----------------------------
if __name__ == "__main__":
    students = generate_dummy_students(10)
    analyze_students(students)