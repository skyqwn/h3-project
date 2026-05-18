import { getTranslations } from "next-intl/server";
import { DisplayHeading } from "@/components/primitives/DisplayHeading";
import { Button } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6">
      <div className="text-center space-y-6">
        <DisplayHeading level="lg">{t("title")}</DisplayHeading>
        <div>
          <Button href="/" variant="primary" size="md">
            {t("back")}
          </Button>
        </div>
      </div>
    </div>
  );
}
