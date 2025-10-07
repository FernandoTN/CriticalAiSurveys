import { SurveyParticipationFlow } from "@/components/survey/SurveyParticipationFlow";
import { Survey, Question } from "@critical-ai-surveys/schemas";

async function getSurvey(slug: string): Promise<(Survey & { questions: Question[] }) | null> {
  try {
    const res = await fetch(`http://localhost:8000/api/v1/surveys/slug/${slug}`, {
      cache: 'no-store', // For development, ensure fresh data
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch survey:", error);
    return null;
  }
}

export default async function SurveyPage({ params }: { params: { slug: string } }) {
  const survey = await getSurvey(params.slug);

  if (!survey) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Survey not found</h1>
        <p>The survey you are looking for does not exist or is no longer available.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">{survey.title}</h1>
      <p className="text-lg text-muted-foreground mt-2">{survey.description}</p>
      <div className="mt-8">
        <SurveyParticipationFlow survey={survey} />
      </div>
    </div>
  );
}