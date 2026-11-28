import Image from "next/image";
import Link from "next/link";
// Layout and local assets adapted from the supplied Figma design.
const imgIconArrowRight = "/landing/08f66e26-e0cd-4437-974e-140fbbf9d0ce.svg";

export default function Nav() {
  return (
    <div className="content-stretch flex gap-[40px] items-center px-[80px] py-[22px] relative size-full" data-node-id="293:3885" data-name="Nav">
      <Link href="/" aria-label="BHE Uni home" className="shrink-0"><Image src="/logo.png" alt="BHE Uni" width={153} height={61} preload className="h-auto w-[116px]" /></Link>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0]  font-semibold gap-[32px] items-start justify-center leading-[20px] min-w-px relative text-[14px] text-[rgba(255,255,255,0.78)] whitespace-nowrap" data-node-id="293:3932" data-name="Links">
        <a href="#how-it-works" className="relative shrink-0" data-node-id="293:3933">
          How it works
        </a>
        <a href="#rewards" className="relative shrink-0" data-node-id="293:3934">
          Rewards
        </a>
        <a href="#milestones" className="relative shrink-0" data-node-id="301:522">
          Milestones
        </a>
        <a href="#features" className="relative shrink-0" data-node-id="293:3935">
          Features
        </a>
        <a href="#payouts" className="relative shrink-0" data-node-id="293:3936">
          Payouts
        </a>
        <a href="#faq" className="relative shrink-0" data-node-id="293:3937">
          FAQ
        </a>
      </div>
      <div className="content-stretch flex gap-[12px] items-center relative shrink-0" data-node-id="293:3938" data-name="Frame">
        <a href="/login" className="border border-[rgba(255,255,255,0.35)] border-solid content-stretch flex items-center px-[20px] py-[12px] relative rounded-[8px] shrink-0" data-node-id="293:3939" data-name="Button · Sign in">
          <p className="[word-break:break-word]  font-bold leading-[20px] relative shrink-0 text-[14px] text-white whitespace-nowrap" data-node-id="293:3940">
            Sign in
          </p>
        </a>
        <a href="/signup" className="bg-[#f26925] content-stretch flex gap-[8px] items-center px-[20px] py-[12px] relative rounded-[8px] shrink-0" data-node-id="293:3941" data-name="Button · Become an ambassador">
          <p className="[word-break:break-word]  font-bold leading-[20px] relative shrink-0 text-[14px] text-white whitespace-nowrap" data-node-id="293:3942">
            Become an ambassador
          </p>
          <div className="flex items-center justify-center relative shrink-0 size-[21.856px]" data-node-id="293:3943">
            <div className="-rotate-30 flex-none">
              <div className="relative size-[16px]" data-name="Icon/arrow-right">
                <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
