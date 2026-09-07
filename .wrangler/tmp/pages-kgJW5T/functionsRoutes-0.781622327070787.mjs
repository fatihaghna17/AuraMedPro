import { onRequestGet as __api_achievements_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/achievements.ts"
import { onRequestOptions as __api_achievements_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/achievements.ts"
import { onRequestPost as __api_achievements_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/achievements.ts"
import { onRequestOptions as __api_ai_explain_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/ai-explain.ts"
import { onRequestPost as __api_ai_explain_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/ai-explain.ts"
import { onRequestGet as __api_app_settings_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/app-settings.ts"
import { onRequestOptions as __api_app_settings_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/app-settings.ts"
import { onRequestPost as __api_app_settings_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/app-settings.ts"
import { onRequestOptions as __api_delete_question_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/delete-question.ts"
import { onRequestPost as __api_delete_question_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/delete-question.ts"
import { onRequestGet as __api_leaderboard_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/leaderboard.ts"
import { onRequestOptions as __api_leaderboard_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/leaderboard.ts"
import { onRequestPost as __api_leaderboard_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/leaderboard.ts"
import { onRequestGet as __api_notes_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/notes.ts"
import { onRequestOptions as __api_notes_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/notes.ts"
import { onRequestPost as __api_notes_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/notes.ts"
import { onRequestGet as __api_profiles_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/profiles.ts"
import { onRequestOptions as __api_profiles_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/profiles.ts"
import { onRequestPost as __api_profiles_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/profiles.ts"
import { onRequestDelete as __api_question_banks_ts_onRequestDelete } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/question-banks.ts"
import { onRequestGet as __api_question_banks_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/question-banks.ts"
import { onRequestOptions as __api_question_banks_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/question-banks.ts"
import { onRequestPost as __api_question_banks_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/question-banks.ts"
import { onRequestOptions as __api_question_reports_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/question-reports.ts"
import { onRequestPost as __api_question_reports_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/question-reports.ts"
import { onRequestDelete as __api_quiz_sessions_ts_onRequestDelete } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/quiz-sessions.ts"
import { onRequestGet as __api_quiz_sessions_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/quiz-sessions.ts"
import { onRequestOptions as __api_quiz_sessions_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/quiz-sessions.ts"
import { onRequestPost as __api_quiz_sessions_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/quiz-sessions.ts"
import { onRequestGet as __api_r2_questions_ts_onRequestGet } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/r2-questions.ts"
import { onRequestOptions as __api_r2_questions_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/r2-questions.ts"
import { onRequestOptions as __api_upload_question_ts_onRequestOptions } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/upload-question.ts"
import { onRequestPost as __api_upload_question_ts_onRequestPost } from "/home/kkskr/Proyek/cbt-latihan-soal-pro/functions/api/upload-question.ts"

export const routes = [
    {
      routePath: "/api/achievements",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_achievements_ts_onRequestGet],
    },
  {
      routePath: "/api/achievements",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_achievements_ts_onRequestOptions],
    },
  {
      routePath: "/api/achievements",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_achievements_ts_onRequestPost],
    },
  {
      routePath: "/api/ai-explain",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_ai_explain_ts_onRequestOptions],
    },
  {
      routePath: "/api/ai-explain",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_ai_explain_ts_onRequestPost],
    },
  {
      routePath: "/api/app-settings",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_app_settings_ts_onRequestGet],
    },
  {
      routePath: "/api/app-settings",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_app_settings_ts_onRequestOptions],
    },
  {
      routePath: "/api/app-settings",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_app_settings_ts_onRequestPost],
    },
  {
      routePath: "/api/delete-question",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_delete_question_ts_onRequestOptions],
    },
  {
      routePath: "/api/delete-question",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_delete_question_ts_onRequestPost],
    },
  {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_leaderboard_ts_onRequestGet],
    },
  {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_leaderboard_ts_onRequestOptions],
    },
  {
      routePath: "/api/leaderboard",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_leaderboard_ts_onRequestPost],
    },
  {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_notes_ts_onRequestGet],
    },
  {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_notes_ts_onRequestOptions],
    },
  {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_notes_ts_onRequestPost],
    },
  {
      routePath: "/api/profiles",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_profiles_ts_onRequestGet],
    },
  {
      routePath: "/api/profiles",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_profiles_ts_onRequestOptions],
    },
  {
      routePath: "/api/profiles",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_profiles_ts_onRequestPost],
    },
  {
      routePath: "/api/question-banks",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_question_banks_ts_onRequestDelete],
    },
  {
      routePath: "/api/question-banks",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_question_banks_ts_onRequestGet],
    },
  {
      routePath: "/api/question-banks",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_question_banks_ts_onRequestOptions],
    },
  {
      routePath: "/api/question-banks",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_question_banks_ts_onRequestPost],
    },
  {
      routePath: "/api/question-reports",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_question_reports_ts_onRequestOptions],
    },
  {
      routePath: "/api/question-reports",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_question_reports_ts_onRequestPost],
    },
  {
      routePath: "/api/quiz-sessions",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_quiz_sessions_ts_onRequestDelete],
    },
  {
      routePath: "/api/quiz-sessions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_quiz_sessions_ts_onRequestGet],
    },
  {
      routePath: "/api/quiz-sessions",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_quiz_sessions_ts_onRequestOptions],
    },
  {
      routePath: "/api/quiz-sessions",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_quiz_sessions_ts_onRequestPost],
    },
  {
      routePath: "/api/r2-questions",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_r2_questions_ts_onRequestGet],
    },
  {
      routePath: "/api/r2-questions",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_r2_questions_ts_onRequestOptions],
    },
  {
      routePath: "/api/upload-question",
      mountPath: "/api",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_upload_question_ts_onRequestOptions],
    },
  {
      routePath: "/api/upload-question",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_question_ts_onRequestPost],
    },
  ]