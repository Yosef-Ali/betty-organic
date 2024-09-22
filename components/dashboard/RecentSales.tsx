import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const recentSales = [
  { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00", avatar: "/avatars/01.png", initials: "OM" },
  { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00", avatar: "/avatars/02.png", initials: "JL" },
  { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "+$299.00", avatar: "/avatars/03.png", initials: "IN" },
  { name: "William Kim", email: "will@email.com", amount: "+$99.00", avatar: "/avatars/04.png", initials: "WK" },
  { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+$39.00", avatar: "/avatars/05.png", initials: "SD" },
];

export function RecentSales() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8">
        {recentSales.map((sale, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="hidden sm:block">
              <Avatar className="h-9 w-9">
                <AvatarImage src={sale.avatar} alt="Avatar" />
                <AvatarFallback>{sale.initials}</AvatarFallback>
              </Avatar>
            </div>
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">{sale.name}</p>
              <p className="text-sm text-muted-foreground">{sale.email}</p>
            </div>
            <div className="ml-auto font-medium">{sale.amount}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}