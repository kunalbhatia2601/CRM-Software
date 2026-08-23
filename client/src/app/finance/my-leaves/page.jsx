import { getMyLeaveRequests, listLeaveTypes, getMyLeaveBalances } from "@/actions/leave.action";
import MyLeavesContent from "@/components/attendance/MyLeavesContent";

export default async function AccountsMyLeavesPage() {
  const [reqRes, typeRes, balRes] = await Promise.all([
    getMyLeaveRequests(),
    listLeaveTypes(),
    getMyLeaveBalances(),
  ]);
  return (
    <MyLeavesContent
      initialRequests={reqRes.success ? reqRes.data : []}
      initialTypes={typeRes.success ? typeRes.data : []}
      initialBalances={balRes.success ? balRes.data : []}
    />
  );
}
