import random
from flask import Flask, render_template, request, session, jsonify

app = Flask(__name__)
app.secret_key = "techtitan-t20-secret-key-2026"


# ─── helpers ──────

def init_session(role):
    """Initialise a fresh innings in the session."""
    session["innings"] = 1
    session["role"] = role                # "bat" or "bowl"
    session["score"] = 0
    session["wickets"] = 0
    session["balls"] = 0
    session["target"] = None
    session["innings1_score"] = None
    session["game_over"] = False
    session["first_role"] = role          # remember what user chose first


def overs_display(balls):
    """Return overs string like '1.3' from a ball count."""
    return f"{balls // 6}.{balls % 6}"


# ─── routes ─────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/toss", methods=["POST"])
def toss():
    """Receive the user's role choice and set up the session."""
    data = request.get_json()
    role = data.get("choice", "bat")      # "bat" or "bowl"
    init_session(role)
    return jsonify({"status": "ok", "role": role})


@app.route("/play", methods=["POST"])
def play():
    """
    Core gameplay endpoint.
    Receives: { number: 1-6 }
    Returns JSON with full game state update.
    """
    if session.get("game_over"):
        return jsonify({"error": "Game is already over. Please reset."})

    data = request.get_json()
    user_num = int(data.get("number", 1))
    cpu_num = random.choice([1, 2, 3, 4, 6])

    role = session["role"]
    out = False
    runs = 0
    commentary = ""

    # ── determine outcome ────
    if user_num == cpu_num:
        out = True
        session["wickets"] += 1
        if role == "bat":
            commentary = "OUT! 💥 You and the CPU both chose {}!".format(user_num)
        else:
            commentary = "WICKET! 🎯 You got the CPU out with {}!".format(user_num)
    else:
        if role == "bat":
            runs = user_num
            commentary = "You smash {} run{}! 🏏 (CPU bowled {})".format(
                runs, "s" if runs != 1 else "", cpu_num
            )
        else:
            runs = cpu_num
            commentary = "CPU scores {} run{}! 🏃 (You bowled {})".format(
                runs, "s" if runs != 1 else "", user_num
            )
        session["score"] += runs

    session["balls"] += 1

    # ── check innings end conditions ───
    innings_over = False
    reason = ""

    if session["wickets"] >= 2:
        innings_over = True
        reason = "All wickets fallen!"
    elif session["balls"] >= 12:
        innings_over = True
        reason = "Over limit reached (2 overs)!"

    # Check chase target exceeded (innings 2 batting)
    if session["innings"] == 2 and session["target"] is not None:
        if role == "bat" and session["score"] > session["target"]:
            innings_over = True
            reason = "Target chased! 🎉"
        elif role == "bowl" and session["score"] > session["target"]:
            innings_over = True
            reason = "CPU chased the target! 😞"

    # ── handle innings transition or game over ────
    game_over = False
    result = ""
    switch_info = None

    if innings_over:
        if session["innings"] == 1:
            # Save innings-1 score, flip roles, start innings 2
            session["innings1_score"] = session["score"]
            session["target"] = session["score"]
            session["innings"] = 2
            session["role"] = "bowl" if session["first_role"] == "bat" else "bat"
            session["score"] = 0
            session["wickets"] = 0
            session["balls"] = 0

            switch_info = {
                "target": session["target"],
                "new_role": session["role"],
                "reason": reason,
            }
        else:
            # Game over — determine winner
            game_over = True
            session["game_over"] = True

            batsman_score = session["score"] if session["role"] == "bat" else session["innings1_score"]
            bowler_score = session["innings1_score"] if session["role"] == "bat" else session["score"]

            if session["first_role"] == "bat":
                user_total = session["innings1_score"]
                cpu_total = session["score"]
            else:
                cpu_total = session["innings1_score"]
                user_total = session["score"]

            if user_total > cpu_total:
                result = "🏆 You WIN by {} run{}!".format(
                    user_total - cpu_total,
                    "s" if (user_total - cpu_total) != 1 else ""
                )
            elif cpu_total > user_total:
                result = "😢 CPU wins by {} run{}!".format(
                    cpu_total - user_total,
                    "s" if (cpu_total - user_total) != 1 else ""
                )
            else:
                result = "🤝 It's a TIE! What a match!"

    # ── build response ─────
    response = {
        "user_num": user_num,
        "cpu_num": cpu_num,
        "out": out,
        "runs": runs,
        "commentary": commentary,
        "score": session["score"],
        "wickets": session["wickets"],
        "balls": session["balls"],
        "overs": overs_display(session["balls"]),
        "role": session["role"],
        "innings": session["innings"],
        "target": session.get("target"),
        "innings_over": innings_over,
        "game_over": game_over,
        "result": result,
    }

    if switch_info:
        response["switch"] = switch_info

    return jsonify(response)


@app.route("/reset", methods=["POST"])
def reset():
    session.clear()
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)
