import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { Item, DisposalRecord } from "../context/AppContext";

interface DisposalDialogProps {
  item: Item;
  open: boolean;
  onClose: () => void;
  onConfirm: (record: Omit<DisposalRecord, "id">) => void;
}

const DISPOSAL_REASONS = ["소비기한 초과", "개봉 후 기한 초과", "변질", "파손", "오염", "기타"];

export function DisposalDialog({ item, open, onClose, onConfirm }: DisposalDialogProps) {
  const today = new Date().toISOString().split("T")[0];
  const [reason, setReason] = useState(DISPOSAL_REASONS[0]);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [loss, setLoss] = useState("");
  const [handler, setHandler] = useState(item.assignee);

  function handleSubmit() {
    if (!reason || !quantity || !handler) return;
    onConfirm({
      date: today,
      itemName: item.name,
      quantity: Number(quantity),
      unit: item.unit,
      reason,
      loss: Number(loss) || 0,
      handler,
      approver: null,
      status: "pending",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>폐기 처리 - {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>폐기 사유</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="border-[#e4e4e7]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISPOSAL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>수량 ({item.unit})</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min={0}
                className="border-[#e4e4e7]"
              />
            </div>
            <div className="space-y-1.5">
              <Label>손실 금액 (원)</Label>
              <Input
                type="number"
                value={loss}
                onChange={(e) => setLoss(e.target.value)}
                placeholder="0"
                min={0}
                className="border-[#e4e4e7]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>처리 담당자</Label>
            <Input
              value={handler}
              onChange={(e) => setHandler(e.target.value)}
              className="border-[#e4e4e7]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-[#e4e4e7]">취소</Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#ef4444] hover:bg-[#dc2626] text-white"
            disabled={!reason || !quantity || !handler}
          >
            폐기 처리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
