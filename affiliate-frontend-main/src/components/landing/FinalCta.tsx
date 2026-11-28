import Image from "next/image";
// Layout and local assets adapted from the supplied Figma design.
const imgIconArrowRight = "/landing/0310de88-1035-4e20-a91a-b6e578009c2a.svg";
const imgEllipse = "/landing/a58d947c-1dd6-4f19-9df3-69706d2bba3f.svg";

export default function FinalCta() {
  return (
    <div className="content-stretch flex flex-col items-start pb-[112px] px-[80px] relative size-full" data-node-id="296:715" data-name="Final CTA">
      <div className="bg-gradient-to-r content-stretch flex from-[#293171] gap-[40px] items-center overflow-clip px-[64px] py-[56px] relative rounded-[20px] shrink-0 to-[#1f2660] w-full" data-node-id="296:716" data-name="Frame">
        <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[12px] items-start min-w-px relative" data-node-id="296:717" data-name="Frame">
          <h2 className=" font-extrabold leading-[44px] relative shrink-0 text-[36px] text-white tracking-[-0.72px] w-full" data-node-id="296:718">
            Your next conversation could change a friend’s life.
          </h2>
          <p className=" font-medium leading-[24px] relative shrink-0 text-[17px] text-[rgba(255,255,255,0.72)] w-full" data-node-id="296:719">
            Join free in under a minute. Start earning from your first verified referral.
          </p>
        </div>
        <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-node-id="296:720" data-name="Frame">
          <a href="/signup" className="[word-break:break-word] bg-white content-stretch flex gap-[8px] items-center leading-[21px] px-[22px] py-[15px] relative rounded-[8px] shrink-0 text-[15px] whitespace-nowrap" data-node-id="296:721" data-name="Button · Continue with Google">
            <Image src="/landing/google-g.png" alt="" width={18} height={18} unoptimized style={{ flexShrink: 0 }} />
            <p className=" font-bold relative shrink-0 text-[#292c43]" data-node-id="296:723">
              Continue with Google
            </p>
          </a>
          <a href="/signup" className="bg-[#f26925] content-stretch flex gap-[8px] items-center px-[22px] py-[15px] relative rounded-[8px] shrink-0" data-node-id="296:724" data-name="Button · Sign up with email">
            <p className="[word-break:break-word]  font-bold leading-[21px] relative shrink-0 text-[15px] text-white whitespace-nowrap" data-node-id="296:725">
              Sign up with email
            </p>
            <div className="relative shrink-0 size-[16px]" data-node-id="296:726" data-name="Icon/arrow-right">
              <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgIconArrowRight} />
            </div>
          </a>
        </div>
        <div className="absolute left-[900px] size-[420px] top-[-180px]" data-node-id="296:728" data-name="Ellipse">
          <div className="absolute inset-[-28.57%]">
            <img alt="" className="block max-w-none size-full" src={imgEllipse} />
          </div>
        </div>
      </div>
    </div>
  );
}
