# Techtitan T20 - Hand Cricket 🏏

A beginner-friendly Hand Cricket web application named "Techtitan T20". Developed with a Python (Flask) backend, vanilla JavaScript, and HTML/CSS. 

## Features
- **Interactive Toss Phase:** Choose Heads or Tails to decide who bats first.
- **Dynamic Gameplay:** Play Hand Cricket against the CPU by choosing numbers 1 to 6.
- **Real-time Scoreboard:** Live updates of score, wickets, and overs.
- **Commentary:** Exciting real-time commentary for every ball.

## How to Play
1. Click **Play Game** to start the match.
2. Choose **Heads** or **Tails** for the toss. 
3. In each delivery, select a number from 1 to 6.
4. If your chosen number matches the CPU's number, the batsman is OUT.
5. Otherwise, the number chosen by the batsman is added to their score.
6. The innings ends after 2 wickets or 2 overs (12 balls).
7. The team with the highest score at the end of both innings wins!

## Installation & Running Locally

### Prerequisites
- Python 3.x

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the application:
   ```bash
   python app.py
   ```
4. Open your browser and navigate to `http://127.0.0.1:5000`

## Tech Stack
- **Backend:** Python, Flask
- **Frontend:** HTML5, CSS3, JavaScript
