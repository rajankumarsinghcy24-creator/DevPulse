/**
 * DevPulse AI Service Module
 *
 * Provides configurable external AI provider integration for intelligent task generation.
 * Supports provider swapping via environment variables (AI_PROVIDER: "gemini" | "mock").
 * Validates, structures, and sanitizes AI output before returning it to the controller.
 */

const { ApiError } = require("../middleware/errorHandler");

/**
 * Validates and sanitizes the parsed AI task list.
 */
const validateGeneratedTasks = (tasks, requestedCount = 5) => {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    throw new ApiError("AI returned an invalid task format. Expected a non-empty array.", 502);
  }

  const validPriorities = ["low", "medium", "high"];
  const now = new Date();

  return tasks.slice(0, requestedCount).map((task, index) => {
    const title =
      typeof task.title === "string" && task.title.trim()
        ? task.title.trim()
        : `Generated Task ${index + 1}`;

    const description =
      typeof task.description === "string" ? task.description.trim() : "";

    let priority =
      typeof task.priority === "string" ? task.priority.toLowerCase().trim() : "medium";
    if (!validPriorities.includes(priority)) {
      priority = "medium";
    }

    const estimatedDays =
      typeof task.estimatedDays === "number" && task.estimatedDays > 0
        ? Math.min(Math.max(Math.round(task.estimatedDays), 1), 30)
        : (index % 3) + 2; // Default 2 to 4 days

    let suggestedDueDate;
    if (task.suggestedDueDate && !isNaN(Date.parse(task.suggestedDueDate))) {
      suggestedDueDate = new Date(task.suggestedDueDate).toISOString();
    } else {
      suggestedDueDate = new Date(
        now.getTime() + estimatedDays * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const estimatedDuration =
      typeof task.estimatedDuration === "string" && task.estimatedDuration.trim()
        ? task.estimatedDuration.trim()
        : `${estimatedDays} day${estimatedDays > 1 ? "s" : ""}`;

    return {
      title,
      description,
      priority,
      suggestedDueDate,
      estimatedDuration
    };
  });
};

/**
 * Generates tasks via Google Gemini REST API.
 */
const generateWithGemini = async ({
  projectName,
  projectDescription,
  additionalInstructions,
  taskCount,
  apiKey,
  model
}) => {
  const configuredModel = model || "gemini-3.6-flash";
  // Unique list of candidate models with user's configured model prioritized first
  const candidateModels = Array.from(
    new Set([configuredModel, "gemini-3.6-flash", "gemini-3.8-flash", "gemini-flash-latest"])
  );

  const prompt = `You are an expert technical project manager and software architect.
Generate exactly ${taskCount || 5} actionable, high-quality engineering and development tasks for the following project:

Project Name: ${projectName}
Project Description: ${projectDescription || "General software development project"}
${additionalInstructions ? `Specific Guidance / Focus: ${additionalInstructions}` : ""}

Return ONLY a valid JSON array of objects with no markdown fences, no extra text, and no backticks.
Each object in the array must strictly match this schema:
[
  {
    "title": "Concise, actionable task title",
    "description": "Clear step-by-step description of work to complete",
    "priority": "low" | "medium" | "high",
    "estimatedDays": 3,
    "estimatedDuration": "3 days"
  }
]`;

  let lastError = null;

  for (const targetModel of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
          }
        })
      });
    } catch (networkErr) {
      clearTimeout(timeoutId);
      if (networkErr.name === "AbortError") {
        lastError = new ApiError("AI provider request timed out after 15 seconds.", 504);
        continue;
      }
      lastError = new ApiError("Failed to communicate with AI provider.", 502);
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let sanitizedMsg = `AI provider returned HTTP ${response.status}`;
      try {
        const parsedErr = JSON.parse(errorBody);
        if (parsedErr.error && parsedErr.error.message) {
          sanitizedMsg = parsedErr.error.message.replace(/key=[^&\s]+/gi, "key=REDACTED");
        }
      } catch {
        // Keep sanitized status
      }

      // If high demand or model not found, record and attempt fallback model
      lastError = new ApiError(`AI Service Provider Error: ${sanitizedMsg}`, 502);
      if (response.status === 503 || sanitizedMsg.includes("high demand") || response.status === 404) {
        continue;
      }
      throw lastError;
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      lastError = new ApiError("AI provider returned an empty response.", 502);
      continue;
    }

    let parsed;
    try {
      const cleanedText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanedText);
      return validateGeneratedTasks(parsed, taskCount);
    } catch (parseErr) {
      lastError = new ApiError("Failed to parse JSON response from AI provider.", 502);
      continue;
    }
  }

  throw lastError || new ApiError("AI task generation failed on all available models.", 502);
};

/**
 * Mock generator for offline development and deterministic unit/integration testing.
 */
const generateWithMock = ({
  projectName,
  projectDescription,
  additionalInstructions,
  taskCount
}) => {
  const count = taskCount || 5;
  const mockTemplates = [
    {
      title: `Architect Initial Database Schema for ${projectName}`,
      description: `Design relational schema and models based on: ${projectDescription || "project requirements"}. Include migrations and foreign keys.`,
      priority: "high",
      estimatedDays: 2,
      estimatedDuration: "2 days"
    },
    {
      title: `Implement REST API Endpoints and Validation`,
      description: `Create Express routes, controllers, and input validators for core project resources.`,
      priority: "high",
      estimatedDays: 3,
      estimatedDuration: "3 days"
    },
    {
      title: `Build Responsive Client UI Components`,
      description: `Develop intuitive user interface components with proper state management and loading indicators.`,
      priority: "medium",
      estimatedDays: 4,
      estimatedDuration: "4 days"
    },
    {
      title: `Integrate Automated Test Suite`,
      description: `Write unit and integration tests covering happy paths, edge cases, and authorization boundaries.`,
      priority: "medium",
      estimatedDays: 2,
      estimatedDuration: "2 days"
    },
    {
      title: `Configure Deployment and CI/CD Pipeline`,
      description: `Setup build scripts, environment variables, and automated verification before release.`,
      priority: "low",
      estimatedDays: 1,
      estimatedDuration: "1 day"
    },
    {
      title: `Conduct Security and Performance Audit`,
      description: `Verify data isolation, sanitize user inputs, and check database query indexing.`,
      priority: "medium",
      estimatedDays: 2,
      estimatedDuration: "2 days"
    },
    {
      title: `Draft User Documentation and API Guides`,
      description: `Document endpoints, usage instructions, and developer onboarding workflows.`,
      priority: "low",
      estimatedDays: 1,
      estimatedDuration: "1 day"
    }
  ];

  const tasks = [];
  for (let i = 0; i < count; i++) {
    const template = mockTemplates[i % mockTemplates.length];
    tasks.push({
      ...template,
      title: i >= mockTemplates.length ? `${template.title} (Part ${Math.floor(i / mockTemplates.length) + 1})` : template.title
    });
  }

  return validateGeneratedTasks(tasks, count);
};

/**
 * Main Task Generation Service
 */
const generateTasks = async ({
  projectName,
  projectDescription,
  additionalInstructions,
  taskCount
}) => {
  const apiKey = process.env.AI_API_KEY;
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const model = process.env.AI_MODEL;

  // If explicitly configured for mock or testing, use the mock generator
  if (provider === "mock") {
    return generateWithMock({
      projectName,
      projectDescription,
      additionalInstructions,
      taskCount
    });
  }

  // Gemini provider requires a configured API key
  if (!apiKey || apiKey.includes("your_ai_api_key")) {
    throw new ApiError(
      "AI service is not configured. Please set a valid AI_API_KEY in server environment variables.",
      503
    );
  }

  if (provider === "gemini") {
    return await generateWithGemini({
      projectName,
      projectDescription,
      additionalInstructions,
      taskCount: taskCount || 5,
      apiKey,
      model
    });
  }

  throw new ApiError(`Unsupported AI_PROVIDER '${provider}'. Supported providers: 'gemini', 'mock'.`, 500);
};

module.exports = {
  generateTasks,
  validateGeneratedTasks,
  generateWithMock
};
